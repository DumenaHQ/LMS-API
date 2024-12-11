import Class, { ClassTemplate, IClass, IAddLearner, EStatus, ITemplate, ITerm } from './model';
import Course from '../course/model';
import { IUserView, Learner } from '../user/models';
import { handleError } from '../helpers/handleError';
import mongoose from 'mongoose';
import { ICourseView, IModule } from '../course/interfaces';
import { courseService } from '../course/service';
import { userService } from '../user/service';
import { USER_TYPES, UPLOADS, ORDER_TYPES, TERMS } from '../config/constants';
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
    async create(classData: IClass, files: File): Promise<any> {
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


    async view(criteria: object | string): Promise<IClass> {
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

        const learners = await userService.list({
            'user._id': { $in: classroom.learners.map((learner: { user_id: string }) => learner.user_id) },
            'user.deleted': false
        }, 'learner');
        classroom.learners = await markSubedLearners(learners);
        classroom.learner_count = classroom.learners && classroom.learners.length || 0;

        const courses = classroom.template ? classroom.template.courses : classroom.courses;
        classroom.course_count = courses.length;
        classroom.courses = await courseService.list({ _id: { $in: courses } });

        let teacher;
        if (classroom.teacher_id) {
            teacher = await userService.view({ _id: classroom.teacher_id });
            teacher = {
                id: teacher.id,
                fullname: teacher.fullname,
                email: teacher.email
            };
        }

        classroom.active_term = this.getClassActiveTerm(classroom.terms);

        return { ...classroom, teacher };

        async function markSubedLearners(allLearners: IUserView[]) {
            // TODO: add session
            console.log(classroom.active_term)
            const term_title = classroom.active_term ? classroom.active_term.title : null;
            const today = new Date();
            const criteria = { 
                class: classroom._id,
                term: term_title,
                status: ESubscriptionStatus.Active,
                expiry_date: { $gte: today }
            };
            const classSubscriptions = await classSubscriptionService.listSubs(criteria);
            const subscribedLearnersId = classSubscriptionService.getSubedLearnersForClass(classSubscriptions);
            return allLearners.map((learner: IUserView) => {
                return subscribedLearnersId.includes(learner.id)
                    ? { ...learner, paid: true }
                    : { ...learner, paid: false }
            });
        }
    },


    async viewLimitedClass(classId: string): Promise<IClass> {
        let classroom: any;
        classroom = await this.findOne({ _id: classId });
        if (!classroom) {
            throw new handleError(404, 'Class not found');
        }
        classroom = classroom.toJSON();

        classroom.learners = await userService.list({
            'user._id': { $in: classroom.learners.map((learner: { user_id: string }) => learner.user_id) },
            'user.deleted': false
        }, 'learner');
        classroom.learner_count = classroom.learners && classroom.learners.length || 0;

        const courses = classroom.template ? classroom.template.courses : classroom.courses;
        classroom.course_count = courses.length;

        let teacher;
        if (classroom.teacher_id) {
            teacher = await userService.view({ _id: classroom.teacher_id });
            teacher = {
                id: teacher.id,
                fullname: teacher.fullname,
                email: teacher.email
            };
        }

        classroom.active_term = this.getClassActiveTerm(classroom.terms);

        return { ...classroom, teacher };
    },


    async viewClass(classId: string, { roleUserId, role }: { roleUserId: string, role: string }): Promise<IClass | null> {
        const defaultParam: any = { _id: new mongoose.Types.ObjectId(classId) };

        const criteria = {
            [USER_TYPES.learner]: { ...defaultParam, 'learners.user_id': roleUserId },
            [USER_TYPES.school]: { ...defaultParam, school_id: roleUserId },
            [USER_TYPES.parent]: { ...defaultParam, parent_id: roleUserId },
            [USER_TYPES.instructor]: { ...defaultParam, teacher_id: roleUserId },
            [USER_TYPES.admin]: defaultParam
        };
        return this.view(criteria[role]);
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

            _class.active_term = this.getClassActiveTerm(klas.terms);
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


    async addCourses(model: 'class' | 'template', modelId: string, courseIds: [string]): Promise<void> {
        const classOrTemplate = await classOrTemplateModel[model].findById(modelId);

        if (!classOrTemplate) {
            throw new handleError(400, `Invalid ${model} ID`);
        }

        const validatedCourses = await Promise.all(courseIds.map(async (courseId: string) => {
            return Course.findById(courseId).select('_id modules');
            // return foundCourse ? foundCourse : null;
        }));
        const validatedCourseIds = validatedCourses.filter((course) => course?._id);
        const courses = new Set([...classOrTemplate.courses, ...validatedCourseIds]);
        classOrTemplate.courses = Array.from(courses);
        await classOrTemplate.save();

        if (model === 'template') {
            try {
                await this.distributeModulesToClassTemplateTerms(classOrTemplate, courseIds);
                // this.mapWeeklyMilestone(validatedCourses, classOrTemplate.terms[0]);
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
            await Class.findByIdAndUpdate(_class._id, { $push: { learners: learnersToAdd }});
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
        const active_term = this.getClassActiveTerm(_class.terms);

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
            active_term = this.getClassActiveTerm(klass.terms);
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

    async updateDefaultTermsForClass(schoolId: string, defaultTermDates: ITerm) {
        return Class.updateMany(
            { school_id: schoolId, 'terms.title': defaultTermDates.title }, 
            { $set: { 'terms.$': defaultTermDates }}
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

    // async subscribe(classId: string, userId: string, learners: []) {
    //     const klass = await this.findOne({ _id: classId }, false);
    //     const meta_data = { classId };
    //     const orderItems = learners.map((learner: any) => {
    //         const { user_id, name } = learner;
    //         return { order_type_id: klass?.template, user_id, name, order_type: 'class', meta_data };
    //     });
    //     //return orderService.create({ items: orderItems, user: new mongoose.Types.ObjectId(userId), item_type: ORDER_TYPES.class });
    // },

    getClassActiveTerm(terms: ITerm[]): ITerm | null {
        if (terms.length === 0) {
            return null;
        }
        const today = new Date();
        const activeTerm = terms.find(term => {
            const startDate = new Date(term.start_date);
            const endDate = new Date(term.end_date);
            return startDate <= today && today <= endDate;
        });
        return activeTerm?? null;
    },

    async distributeModulesToClassTemplateTerms(classTemplate: ITemplate, courseIds: string[]): Promise<void> {
        if (!classTemplate.terms) return;
        if (classTemplate.terms.length < 1) {
            throw new Error(`Class Template must have at least one term.`);
        }
        const courses = await Course.find({ _id: { $in: courseIds } });
        const numOfTerms = classTemplate.terms.length;
        
        for (const course of courses) {
            const totalModules = course.modules.length;
            const minModulesPerTerm = Math.floor(totalModules / numOfTerms);
            const moduleRemainders = totalModules % numOfTerms;

            let modulesPerTerm = minModulesPerTerm;
            if (moduleRemainders == 2) {
                modulesPerTerm++;
                classTemplate.terms[0].modules.push(...course.modules.slice(0, modulesPerTerm));
                classTemplate.terms[1].modules.push(...course.modules.slice(modulesPerTerm, modulesPerTerm + 1));
            } else if (moduleRemainders == 1) {
                modulesPerTerm++;
                classTemplate.terms[0].modules.push(...course.modules.slice(0, modulesPerTerm));
                classTemplate.terms[1].modules.push(...course.modules.slice(modulesPerTerm, modulesPerTerm + minModulesPerTerm));
            } else {
                classTemplate.terms[0].modules.push(...course.modules.slice(0, minModulesPerTerm));
                classTemplate.terms[1].modules.push(...course.modules.slice(minModulesPerTerm, minModulesPerTerm + minModulesPerTerm));
            }
            classTemplate.terms[2] && classTemplate.terms[2].modules.push(...course.modules.slice(-minModulesPerTerm));

            classTemplate.markModified('terms');
            await classTemplate.save();
        }
    },

    async mapWeeklyMilestone(course: any, term: ITerm, defaultNumOfStudyingWks = 10) {
        const totalLessons = course[0].modules.flatMap((module: IModule) => module.lessons);
        const numOfLessons = totalLessons.length;

        const numOfWeeksInTerm = Math.ceil((new Date(term.end_date).getTime() - new Date(term.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000))
        const numOfStudyWks = defaultNumOfStudyingWks < numOfWeeksInTerm 
            ? defaultNumOfStudyingWks
            : numOfWeeksInTerm - 3;
        const lessonsPerWeek = Math.round(numOfLessons / 2);
        let remainingLessons = numOfLessons % numOfStudyWks;

        const week: any = [];
        for (let lesson = 0; lesson < totalLessons.length; lesson++) {
            let weekLessons = [];
            const numOfLessonsPerWk = remainingLessons > 0 ? lessonsPerWeek + 1 : lessonsPerWeek;
    
            for (let i = 0; i < numOfLessonsPerWk; i++) {
                weekLessons.push(totalLessons[i]);
            }
            week.push(weekLessons);
            if (remainingLessons > 0) remainingLessons--;
        }
    },  
};