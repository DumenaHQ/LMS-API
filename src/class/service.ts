import Class, { ClassTemplate, IClass, IAddLearner, EStatus, ITemplate, ITerm } from './model';
import Course from '../course/model';
import { IUserView, Learner } from '../user/models';
import { handleError } from '../helpers/handleError';
import mongoose from 'mongoose';
import { ICourseView, IModule } from '../course/interfaces';
import { courseService } from '../course/service';
import { userService } from '../user/service';
import { USER_TYPES, UPLOADS, TERMS } from '../config/constants';
import { uploadFile } from '../helpers/fileUploader';
import { lmsBucketName } from '../config/config';
const { BUCKET_NAME: lmsBucket } = lmsBucketName;
import path from 'path';
import { quizService } from '../quiz/service';
import { classSubscriptionService } from '../subscription/classSubscriptionService';
import { ESubscriptionStatus } from '../subscription/model';

const classOrTemplateModel: Record<string, any> = {
    'class': Class,
    'template': ClassTemplate
};

export const classService = {
    async create(classData: IClass, files: any): Promise<any> {
        if (classData.template) {
            const template = await ClassTemplate.findById(classData.template);
            if (!template) throw new handleError(400, 'Invalid template ID');
        }

        const { thumbnail, header_photo }: any = files || {};
        if (thumbnail) {
            const thumbKey = `${UPLOADS.class_thumbs}/${classData.name.split(' ').join('-')}${path.extname(thumbnail.name)}`;
            classData.thumbnail = await uploadFile(lmsBucket, thumbnail, thumbKey);
        }
        if (header_photo) {
            const photoKey = `${UPLOADS.class_header_photos}/${classData.name.split(' ').join('-')}${path.extname(header_photo.name)}`;
            classData.header_photo = await uploadFile(lmsBucket, header_photo, photoKey);
        }

        if (!classData.teacher_id)
            delete classData.teacher_id;

        const klass = await Class.create({
            ...classData,
            terms: [
                {
                    ...TERMS.first_term

                },
                {
                    ...TERMS.second_term

                },
                {
                    ...TERMS.third_term

                }
            ]
        });
        return this.view({ _id: klass._id });
    },

    async createTemplate(templateData: ITemplate) {
        const klassTemplate = new ClassTemplate({
            ...templateData,
            terms: [
                {
                    ...TERMS.first_term

                },
                {
                    ...TERMS.second_term

                },
                {
                    ...TERMS.third_term

                }
            ]
        });
        await klassTemplate.save();
        return klassTemplate;
    },

    async listTemplates(criteria: object): Promise<ITemplate[]> {
        const templates = await ClassTemplate.find({ deleted: false, status: EStatus.Active, ...criteria }).sort({ createdAt: 'desc' });
        return templates.map((template: any) => {
            return { ...template.toJSON(), course_count: template.courses.length };
        });
    },

    async viewTemplate(criteria: object): Promise<ITemplate | {}> {
        const template: Record<string, any> | null = await ClassTemplate.findOne({ deleted: false, status: EStatus.Active, ...criteria });
        if (!template) return {};
        template.course_count = template.courses.length;
        template.courses = await courseService.list({
            _id: { $in: template.courses.map((course: string) => course) }
        });
        return template;
    },


    async findOne(criteria: object, includeTemplate: boolean = true) {
        const params = { deleted: false, status: EStatus.Active, ...criteria };
        const klass = includeTemplate
            ? await Class.findOne(params).populate({ path: 'template' })
            : await Class.findOne(params);
        return klass;
    },


    async view(criteria: object | string, subStatus: string | null): Promise<IClass> {
        let classroom: any;
        if (typeof criteria == 'object')
            classroom = await this.findOne(criteria);
        else {
            classroom = await this.findOne({ _id: criteria });
        }

        if (!classroom) {
            throw new handleError(404, 'Class not found');
        }
        classroom = classroom.toJSON();
        classroom.active_term = this.findActiveTerm(classroom.terms);

        const [
            { learners, learner_count },
            { courses, classCourses, course_count }
        ] = await Promise.all([
            this.processClassLearners(classroom),
            this.processClassCourses(classroom)
        ]);
        classroom.learners = learners;
        classroom.learner_count = learner_count;
        classroom.courses = subStatus == 'inactive' ? [] : classCourses;
        classroom.course_count = course_count;

        let teacher;
        if (classroom.teacher_id) {
            teacher = await userService.view({ _id: classroom.teacher_id });
            teacher = {
                id: teacher.id,
                fullname: teacher.fullname,
                email: teacher.email
            };
        }

        const weeklyLessons = await this.getWeeklyActivities(courses, classroom.active_term);
        return { ...classroom, weeklyLessons, teacher };
    },

    async processClassLearners(classroom: IClass) {
        // TODO: add session
        const term_title = classroom.active_term ? classroom.active_term.title : null;
        const today = new Date();
        const criteria = {
            class: classroom.id,
            term: term_title,
            status: ESubscriptionStatus.Active,
            expiry_date: { $gte: today }
        };
        const [classLearners, classSubscriptions] = await Promise.all([
            userService.list({
                'user._id': { $in: classroom.learners.map((learner: IAddLearner) => learner.user_id) },
                'user.deleted': false
            }, 'learner'),
            classSubscriptionService.listSubs(criteria)
        ]);

        const subscribedLearnersId = classSubscriptionService.getSubedLearnersForClass(classSubscriptions);
        const learners = classLearners.map((learner: IUserView) => {
            return subscribedLearnersId.includes(String(learner.id))
                ? { ...learner, paid: true }
                : { ...learner, paid: false }
        });

        return { learners, learner_count: learners && learners.length || 0 }
    },

    async processClassCourses(classroom: IClass) {
        const courseIds = classroom.template ? classroom.template.courses : classroom.courses;
        const courses = await courseService.list({ _id: { $in: courseIds } });

        const classCourses = courses.map((course: ICourseView) => {
            let modules;
            let lesson_count = course.lesson_count;
            if (classroom.template) {
                const active_term = classroom?.template?.terms.find((term: any) => term.title === classroom.active_term?.title);
                modules = active_term ? active_term.modules : course.modules;
                lesson_count = modules?.reduce((total: number, module: IModule) => total + (module.lessons?.length || 0), 0) || 0;
            }
            return { ...course, module_count: modules?.length, lesson_count, modules };
        });
        return { courses, classCourses, course_count: courses.length };
    },

    async getWeeklyActivities(courses: ICourseView[], term: ITerm) {
        const weeklyLessons = await this.getWeeklyLessons(courses, term, new Date());
        return weeklyLessons;
    },


    // async viewLimitedClass(classId: string): Promise<IClass> {
    //     let classroom: any;
    //     classroom = await this.findOne({ _id: classId });
    //     if (!classroom) {
    //         throw new handleError(404, 'Class not found');
    //     }
    //     classroom = classroom.toJSON();

    //     classroom.learners = await userService.list({
    //         'user._id': { $in: classroom.learners.map((learner: { user_id: string }) => learner.user_id) },
    //         'user.deleted': false
    //     }, 'learner');
    //     classroom.learner_count = classroom.learners && classroom.learners.length || 0;

    //     const courses = classroom.template ? classroom.template.courses : classroom.courses;
    //     classroom.course_count = courses.length;

    //     let teacher;
    //     if (classroom.teacher_id) {
    //         teacher = await userService.view({ _id: classroom.teacher_id });
    //         teacher = {
    //             id: teacher.id,
    //             fullname: teacher.fullname,
    //             email: teacher.email
    //         };
    //     }

    //     classroom.active_term = this.findActiveTerm(classroom.terms);

    //     return { ...classroom, teacher };
    // },


    async viewClass(classId: string, { roleUserId, role }: { roleUserId: string, role: string }, subStatus: string | null): Promise<IClass | null> {
        const defaultParam: any = { _id: new mongoose.Types.ObjectId(classId) };

        const criteria = {
            [USER_TYPES.learner]: { ...defaultParam, 'learners.user_id': roleUserId },
            [USER_TYPES.school]: { ...defaultParam, school_id: roleUserId },
            [USER_TYPES.parent]: { ...defaultParam, parent_id: roleUserId },
            [USER_TYPES.instructor]: { ...defaultParam, teacher_id: roleUserId },
            [USER_TYPES.admin]: defaultParam
        };
        return this.view(criteria[role], subStatus);
    },


    async list(criteria: object, filter: string | null = null): Promise<any[] | []> {
        const classes = await Class.find({ ...criteria, status: EStatus.Active, deleted: false })
            .populate({ path: 'template' }).sort({ createdAt: 'desc' });

        const classIds = classes.map(clas => String(clas._id));
        const today = new Date();
        const activeClassSubs = await classSubscriptionService.listSubs({
            class: { $in: classIds }, status: ESubscriptionStatus.Active, 'term.end_date': { $gte: today }
        });

        const allClasses = await Promise.all(classes.map(async (klas: any) => {
            const _class = klas.toJSON();

            const learners = await userService.list({
                'user._id': { $in: _class.learners.map((learner: { user_id: string }) => learner.user_id) },
                'user.deleted': false
            }, 'learner');

            _class.learner_count = learners.length;
            if (klas.template) {
                _class.course_count = _class.template.courses?.length;
            } else {
                _class.course_count = klas?.courses?.length;
            }

            const subedLearners = activeClassSubs.reduce((learners: any, sub: any) => {
                if (String(sub.class) == String(_class.id))
                    return [...learners, ...sub.learners];
                return learners;
            }, []);

            _class.sub_status = 'none';
            if (subedLearners && subedLearners.length) {
                _class.sub_status = (subedLearners.length == _class.learner_count) ? 'full' : 'part';
            }

            _class.active_term = this.findActiveTerm(klas.terms);
            _class.unpaid_learner_count = _class.learner_count - subedLearners.length;
            delete _class.learners;
            delete _class.courses;
            delete _class.template;

            return _class;
        }));

        switch (filter) {
            case 'active_term':
                return allClasses.filter((clas: any) => clas.active_term != null);
            default:
                return allClasses;
        }
    },

    async fetchClassCourse(classId: string, courseId: string) {
        const klass = await this.findOne({ _id: classId });
        if (!klass) {
            throw new handleError(400, 'Class not found');
        }
        const activeTerm = this.findActiveTerm(klass.terms);
        if (!activeTerm) {
            throw new handleError(400, 'No active term found');
        }
        const klassObj = klass.toObject() as any;
        klassObj.active_term = activeTerm;

        const { classCourses } = await this.processClassCourses(klassObj);
        return classCourses.find((course: any) => String(course.id) === courseId);
    },


    async addCourses(model: 'class' | 'template', modelId: string, courseIds: [string]): Promise<void> {
        const classOrTemplate = await classOrTemplateModel[model].findById(modelId);

        if (!classOrTemplate) {
            throw new handleError(400, `Invalid ${model} ID`);
        }

        const validatedCourses = await Promise.all(courseIds.map(async (courseId: string) => {
            const course = await Course.findById(courseId).select('_id');
            return course?._id;
        }));
        const validatedCourseIds = validatedCourses.filter((course) => course);
        const courses = new Set([...classOrTemplate.courses, ...validatedCourseIds]);
        classOrTemplate.courses = Array.from(courses);
        await classOrTemplate.save();

        if (model === 'template') {
            try {
                await this.distributeModulesToClassTemplateTerms(classOrTemplate, courseIds);
            } catch (error: any) {
                console.log(error.message);
            }
        }

        // if (model === 'class') {
        //     try {
        //         await this.distributeModulesToClassTemplateTerms(modelId, courseIds);
        //     } catch (error: any) {
        //         console.log(error.message);
        //     }
        // }
    },

    async removeCourse(model: 'class' | 'template', modelId: string, courseId: string): Promise<void> {
        const classOrTemplate = await classOrTemplateModel[model].findById(modelId);

        if (!classOrTemplate) {
            throw new handleError(400, `Invalid ${model} ID`);
        }

        const courseIndex = classOrTemplate.courses.findIndex((course: any) => String(course) === courseId);
        if (courseIndex === -1) {
            throw new handleError(400, 'Course not found in class');
        }

        classOrTemplate.courses.splice(courseIndex, 1);
        await classOrTemplate.save();

        if (model === 'template') {
            try {
                await this.distributeModulesToClassTemplateTerms(classOrTemplate, classOrTemplate.courses.map((course: any) => course._id));
            } catch (error: any) {
                console.log(error.message);
            }
        }
    },

    async listCourses(classId: string): Promise<ICourseView[] | []> {
        const _class = await Class.findById(classId);
        if (!_class) throw new handleError(400, 'Class not found');

        return courseService.list({ _id: { $in: _class.courses } });
    },


    async listLearnerClasses(): Promise<IClass[] | []> {
        return this.list({});
    },


    async addLearners(classId: string, learners: IAddLearner[]): Promise<void> {
        const _class = await this.findOne({ _id: classId }, false);
        if (!_class) {
            throw new handleError(400, 'Invalid class ID');
        }

        const addedLearnerIds = _class.learners.map((learner: any) => learner.user_id);

        const validatedLearners = (await Promise.all(learners.map(async (learner: IAddLearner) => {
            const user = await Learner.findOne({
                $or: [{ _id: learner.user_id }, { 'user': learner.user_id }]
            });
            return user ? { user_id: user.user } : null;
        }))).filter((learner) => learner);

        const learnersToAdd = validatedLearners.filter((learner: any) => {
            return !addedLearnerIds.includes(learner.user_id);
        });

        if (learnersToAdd.length) {
            await Class.findByIdAndUpdate(_class._id, { $push: { learners: learnersToAdd } });
        }

        //
        // TODO
        // -----
        // Detect and return learners already added to class
    },

    async listLearners(classId: string, userId: string, payment_status?: 'paid' | 'unpaid') {
        const _class = await Class.findById(classId);
        if (!_class) {
            throw new handleError(400, 'Class not found');
        }
        const active_term = this.findActiveTerm(_class.terms);

        let learners: any = (_class.learners && _class.learners.map(learner => learner.user_id))
            || [];

        if (payment_status) {
            learners = await filterLearners();
        }

        return userService.list({
            'user._id': { $in: learners },
            'user.deleted': false
        }, 'learner');

        async function filterLearners() {
            // TODO: add session
            const today = new Date();
            const criteria = {
                class: classId,
                term: active_term?.title,
                status: ESubscriptionStatus.Active,
                expiry_date: { $gte: today }
            };
            const classSubscriptions = await classSubscriptionService.listSubs(criteria);
            if (!classSubscriptions)
                return learners;

            const subscribedLearnersId = classSubscriptionService.getSubedLearnersForClass(classSubscriptions);

            if (payment_status === 'paid') {
                return subscribedLearnersId;
            }
            if (payment_status === 'unpaid') {
                return learners.filter((learnerId: any) => !subscribedLearnersId.includes(String(learnerId)));
            }
        }
    },

    async removeTeacherFromClass(classId: string): Promise<void> {
        const query = await Class.findByIdAndUpdate(classId, { $set: { teacher_id: null } });
        if (!query) {
            throw new handleError(400, 'Invalid class ID');
        }
    },

    async listClassesForRoles(userId: string, role: string, filter: string | null = null) {
        const criteria = {
            [USER_TYPES.learner]: { 'learners.user_id': userId },
            [USER_TYPES.school]: { school_id: userId },
            [USER_TYPES.parent]: { parent_id: userId },
            [USER_TYPES.instructor]: { teacher_id: userId },
            [USER_TYPES.admin]: {}
        };
        return this.list(criteria[role], filter);
    },

    async update(classId: string, data: Record<string, unknown>, files: File): Promise<any> {
        if (!data.teacher_id || data.teacher_id === '') {
            delete data.teacher_id;
        }
        if (data.teacher_id) {
            const teacher = await userService.findOne({ _id: data.teacher_id });
            if (!teacher || teacher.role !== USER_TYPES.instructor) {
                throw new handleError(400, 'Invalid teacher ID');
            }
        }

        const klass = await Class.findById(classId);
        if (!klass) {
            throw new handleError(400, 'Invalid class ID');
        }
        const { thumbnail, header_photo }: any = files || {};
        if (thumbnail) {
            const thumbKey = `${UPLOADS.class_thumbs}/${klass.name?.split(' ').join('-')}${path.extname(thumbnail.name)}`;
            data.thumbnail = await uploadFile(lmsBucket, thumbnail, thumbKey);
        }
        if (header_photo) {
            const photoKey = `${UPLOADS.class_header_photos}/${klass.name?.split(' ').join('-')}${path.extname(header_photo.name)}`;
            data.header_photo = await uploadFile(lmsBucket, header_photo, photoKey);
        }

        let active_term: ITerm | null = null;
        if (data.active_term_start_date && data.active_term_end_date) {
            active_term = this.findActiveTerm(klass.terms);
            if (active_term) {
                active_term = {
                    title: active_term.title,
                    defaultDateChanged: true,
                    modules: [],
                    start_date: new Date(String(data.active_term_start_date)),
                    end_date: new Date(String(data.active_term_end_date))
                };
                const updatedTerm = klass.terms.findIndex(term => term.title === active_term?.title)!;
                klass.terms[updatedTerm] = active_term;
                data.terms = klass.terms;
            }
        }

        const result = await Class.findByIdAndUpdate(classId, data, { new: true }).lean();

        return { ...result, active_term };
    },

    /**
     * Update default term for all the classes in a school for the current session
     * @param schoolId 
     * @param defaultTermDates 
     * @returns 
     */
    async updateDefaultTermsForClass(schoolId: string, defaultTermDates: ITerm) {
        return Class.updateMany(
            { school_id: schoolId, 'terms.title': defaultTermDates.title },
            { $set: { 'terms.$': defaultTermDates } }
        );
    },

    async updateTemplate(tempateId: string, data: object): Promise<any> {
        return ClassTemplate.findByIdAndUpdate(tempateId, data, { new: true });
    },

    async delete(classId: string): Promise<void> {
        await Class.findByIdAndUpdate(classId, { deleted: true });
    },

    async getClassQuizResults(classId: string, quizId: string) {
        const klass = await this.findOne({ _id: classId }, false);
        if (!klass) {
            throw new handleError(400, 'Class not found');
        }
        const classLearnerIds = klass.learners.map((learner: Record<string, any>) => String(learner.user_id));
        return quizService.listLearnersResult(quizId, classLearnerIds);
    },


    findActiveTerm(terms: ITerm[] = []): ITerm | null {
        const today = new Date();

        for (const term of terms) {
            const startDate = new Date(term.start_date);
            const endDate = new Date(term.end_date);

            if (startDate <= today && today <= endDate) {
                return term;
            }
        }
        return null;
    },


    async distributeModulesToClassTemplateTerms(classTemplate: ITemplate, courseIds: string[]): Promise<void> {
        if (!Array.isArray(classTemplate.terms) || !classTemplate.terms.length) {
            throw new Error('Class template must have at least one term.');
        }

        const courses = await Course.find({ _id: { $in: courseIds } });

        const termCount = classTemplate.terms.length;

        // clean up modules in each term
        for (const term of classTemplate.terms) {
            term.modules = [];
        }

        // distribute modules to terms
        for (const course of courses) {
            const totalModules = course.modules.length;
            const minModulesPerTerm = Math.floor(totalModules / termCount);
            const remainderModules = totalModules % termCount;

            let moduleIndex = 0;

            for (let i = 0; i < termCount; i++) {
                const extraModule = i < remainderModules ? 1 : 0;
                const modulesForTerm = minModulesPerTerm + extraModule;

                classTemplate.terms[i].modules.push(...course.modules.slice(moduleIndex, moduleIndex + modulesForTerm));
                moduleIndex += modulesForTerm;
            }
        }

        classTemplate.markModified('terms');
        await classTemplate.save();
    },

    async getWeeklyLessons(courses: any[], term: ITerm, currentDate: Date, defaultNumOfStudyingWks = 10) {
        const termStartDate = new Date(term.start_date).getTime();
        const termEndDate = new Date(term.end_date).getTime();
        const givenDate = new Date(currentDate).getTime();

        if (givenDate < termStartDate || givenDate > termEndDate) {
            throw new Error("Date is out of the term range");
        }
        // const totalLessons = courses[0].modules.flatMap((module: IModule) => module.lessons);
        const totalLessons = courses.flatMap((course: any) => course.modules.flatMap((module: IModule) => module.lessons));
        const numOfLessons = totalLessons.length;
        const numOfWeeksInTerm = Math.ceil((termEndDate - termStartDate) / (7 * 24 * 60 * 60 * 1000));
        const numOfStudyWks = Math.min(defaultNumOfStudyingWks, numOfWeeksInTerm - 3);
        const lessonsPerWeek = Math.floor(numOfLessons / numOfStudyWks);
        let remainingLessons = numOfLessons % numOfStudyWks;

        const weeks: any[] = [];
        let lessonIndex = 0;

        for (let week = 0; week < numOfStudyWks; week++) {
            const numOfLessonsPerWk = lessonsPerWeek + (remainingLessons > 0 ? 1 : 0);
            const weekLessons = totalLessons.slice(lessonIndex, lessonIndex + numOfLessonsPerWk);
            weeks.push(weekLessons);
            lessonIndex += numOfLessonsPerWk;
            if (remainingLessons > 0) remainingLessons--;
        }

        const weekPosition = Math.ceil((givenDate - termStartDate) / (7 * 24 * 60 * 60 * 1000));

        if (weekPosition < 1 || weekPosition > weeks.length) {
            throw new Error("Invalid week position");
        }

        return weeks[weekPosition - 1];
    },
};