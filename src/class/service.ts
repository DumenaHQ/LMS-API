import Class, { ClassTemplate, IClass, IAddLearner, EStatus, ITemplate, ITerm } from './model';
import Course from '../course/model';
import { Learner } from '../user/models';
import { handleError } from '../helpers/handleError';
import mongoose from 'mongoose';
import { ICourseView } from '../course/interfaces';
import { courseService } from '../course/service';
import { userService } from '../user/service';
import { USER_TYPES, UPLOADS, ORDER_TYPES, TERMS } from '../config/constants';
import { uploadFile } from '../helpers/fileUploader';
import { lmsBucketName } from '../config/config';
const { BUCKET_NAME: lmsBucket } = lmsBucketName;
import path from 'path';
import { quizService } from '../quiz/service';
// import { orderService } from '../order/service';
// import { ClassSubscription } from '../subscription/model';
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

        classroom.learners = await userService.list({
            'user._id': { $in: classroom.learners.map((learner: { user_id: string }) => learner.user_id) },
            'user.deleted': false
        }, 'learner');
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
        console.log({activeClassSubs})
        return Promise.all(classes.map(async (klas: any) => {
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
                    return [...learners, sub.learners];
                return learners;
            }, []);
            console.log({subedLearners})
            _class.sub_status = 'none';
            if (subedLearners && subedLearners.length) {
                _class.sub_status = (subedLearners.length == _class.learner_count) ? 'full' : 'part';
            }

            _class.active_term = this.getClassActiveTerm(klas.terms);
            delete _class.learners;
            delete _class.courses;
            delete _class.template;

            return _class;

            // switch (filter) {
            //     case 'active_term':
            //         return _class.filter((clas: any) => clas.active_term != null);
            //     default:
            //         return _class;
            // }
        }));
    },


    async addCourses(model: 'class' | 'template', modelId: string, courseIds: [string]): Promise<void> {
        const classOrTemplate = await classOrTemplateModel[model].findById(modelId);

        if (!classOrTemplate) {
            throw new handleError(400, `Invalid ${model} ID`);
        }

        const validatedCourses = await Promise.all(courseIds.map(async (courseId: string) => {
            const foundCourse = await Course.findById(courseId).select('_id');
            return foundCourse ? String(foundCourse._id) : null;
        }));
        const validatedCourseIds = validatedCourses.filter((course) => course);
        const courses = new Set([...classOrTemplate.courses, ...validatedCourseIds]);
        classOrTemplate.courses = Array.from(courses);
        await classOrTemplate.save();

        if (model === 'template') {
            try {
                await this.distributeLessonsToClassTemplateTerms(modelId, courseIds);
            } catch (error: any) {
                console.log(error.message);
            }
        }

        if (model === 'class') {
            try {
                await this.distributeLessonsToClassTerms(modelId, courseIds);
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
            await Class.findByIdAndUpdate(_class._id, { $push: { learners: learnersToAdd }});
        }

        //
        // TODO
        // -----
        // Detect and return learners already added to class
    },

    async listLearners(classId: string, userId: string, payment_status?: 'paid' | 'unpaid') {
        const _class = await Class.findById(classId);
        if (!_class) throw new handleError(400, 'Class not found');

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
            const today = new Date();
            const criteria = { user: userId, classId, status: ESubscriptionStatus.Active, 'term.end_date': { $gte: today } };
            const schoolClassSubscription = await classSubscriptionService.findOne(criteria);
            if (!schoolClassSubscription)
                return learners;

            const subscribedLearnersId = schoolClassSubscription.learners;

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
                    start_date: new Date(String(data.active_term_start_date)),
                    end_date: new Date(String(data.active_term_end_date))
                };
                const updatedTerm = klass.terms.findIndex(term => term.title === active_term?.title);
                klass.terms[updatedTerm] = active_term;
                data.terms = klass.terms;
            }
        }

        const result = await Class.findByIdAndUpdate(classId, data, { new: true }).lean();

        return { ...result, active_term };
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

    async subscribe(classId: string, userId: string, learners: []) {
        const klass = await this.findOne({ _id: classId }, false);
        const meta_data = { classId };
        const orderItems = learners.map((learner: any) => {
            const { user_id, name } = learner;
            return { order_type_id: klass?.template, user_id, name, order_type: 'class', meta_data };
        });
        //return orderService.create({ items: orderItems, user: new mongoose.Types.ObjectId(userId), item_type: ORDER_TYPES.class });
    },

    getClassActiveTerm(terms: Array<{
        title: string,
        start_date: Date,
        end_date: Date,
    }>): ITerm | null {
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

    async distributeModulesToClassTemplateTerms(classTemplateId: string, courseIds: string[]): Promise<void> {
        const classTemplate = await ClassTemplate.findById(classTemplateId);
        if (!classTemplate) {
            throw new Error(`Class Template not found.`);
        }
        if (classTemplate.terms.length < 1) {
            throw new Error(`Class Template must have at least one term.`);
        }
        const courses = await Course.find({ _id: { $in: courseIds } });
        for (const course of courses) {
            const totalModules = course.modules.length;
            const modulesPerTerm = Math.ceil(totalModules / classTemplate.terms.length);

            let moduleIndex = 0;
            for (let i = 0; i < classTemplate.terms.length; i++) {
                const term = classTemplate.terms[i];
                term.modules = course.modules.slice(moduleIndex, moduleIndex + modulesPerTerm);
                moduleIndex += modulesPerTerm;
            }
            await classTemplate.save();
        }
    },


    // Distribute lessons in a course across the weeks in a session
    async distributeLessonsToClassTemplateTerms(classTemplateId: string, courseIds: string[]): Promise<void> {
        // Fetch the class template by ID
        const classTemplate = await ClassTemplate.findById(classTemplateId);
        
        // Check if the class template exists
        if (!classTemplate) {
            console.error('Class Template not found.');
            return;
        }
        
        // Check if the class template has at least one term
        if (classTemplate.terms.length < 1) {
            console.error('Class Template must have at least one term.');
            return;
        }
    
        // Fetch the courses by their IDs
        const courses = await Course.find({ _id: { $in: courseIds } });
    
        // Iterate over each course
        for (const course of courses) {
            let lessonIndex = 0;
            
            // Get the total number of lessons across all modules in the course
            const totalLessons = course.modules.flatMap(module => module.lessons).length;
            
            // Calculate the number of weeks for each term
            const termWeeks = classTemplate.terms.map(term => 
                Math.ceil((new Date(term.end_date).getTime() - new Date(term.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000))
            );
            
            // Calculate the total number of weeks across all terms
            const totalWeeks = termWeeks.reduce((acc, weeks) => acc + weeks, 0);
    
            // Create a new array of terms with lessons distributed
            const updatedTerms = classTemplate.terms.map((term, i) => {
                // Calculate the number of weeks in the current term
                const weeksInTerm = termWeeks[i];
                
                // Calculate the number of lessons to assign to this term based on its proportion of total weeks
                const termLessonsCount = Math.round((weeksInTerm / totalWeeks) * totalLessons);
    
                // Initialize an array to hold the lessons for this term
                const termLessons = [];
                
                // Distribute lessons across weeks in the current term
                for (let week = 0; week < weeksInTerm && lessonIndex < totalLessons; week++) {
                    for (const module of course.modules) {
                        // Check if we have not exceeded the number of lessons needed for this term
                        if (lessonIndex < module.lessons.length) {
                            termLessons.push(module.lessons[lessonIndex]);
                            lessonIndex++;
                            // Stop if we have assigned enough lessons for this term
                            if (termLessons.length >= termLessonsCount) {
                                break;
                            }
                        } else {
                            break;
                        }
                    }
                    // Stop if we have assigned enough lessons for this term
                    if (termLessons.length >= termLessonsCount) {
                        break;
                    }
                }
    
                // Return the updated term with assigned lessons
                return { ...term, lessons: termLessons };
            });
    
            // Update the class template with the new terms
            classTemplate.terms = updatedTerms;
            
            try {
                // Save the updated class template to the database
                await classTemplate.save();
            } catch (err: any) {
                // Log any errors that occur during the save operation
                console.error('Failed to save class template:', err.message);
                return;
            }
        }
    },

    async distributeLessonsToClassTerms(classId: string, courseIds: string[]): Promise<void> {
        // Fetch the class template by ID
        const _class = await Class.findById(classId);
        
        // Check if the class template exists
        if (!_class) {
            console.error('Class not found.');
            return;
        }
        
        // Check if the class template has at least one term
        if (_class.terms.length < 1) {
            console.error('Class Template must have at least one term.');
            return;
        }
    
        // Fetch the courses by their IDs
        const courses = await Course.find({ _id: { $in: courseIds } });
    
        // Iterate over each course
        for (const course of courses) {
            let lessonIndex = 0;
            
            // Get the total number of lessons across all modules in the course
            const totalLessons = course.modules.flatMap(module => module.lessons).length;
            
            // Calculate the number of weeks for each term
            const termWeeks = _class.terms.map(term => 
                Math.ceil((new Date(term.end_date).getTime() - new Date(term.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000))
            );
            
            // Calculate the total number of weeks across all terms
            const totalWeeks = termWeeks.reduce((acc, weeks) => acc + weeks, 0);
    
            // Create a new array of terms with lessons distributed
            const updatedTerms = _class.terms.map((term, i) => {
                // Calculate the number of weeks in the current term
                const weeksInTerm = termWeeks[i];
                
                // Calculate the number of lessons to assign to this term based on its proportion of total weeks
                const termLessonsCount = Math.round((weeksInTerm / totalWeeks) * totalLessons);
    
                // Initialize an array to hold the lessons for this term
                const termLessons = [];
                
                // Distribute lessons across weeks in the current term
                for (let week = 0; week < weeksInTerm && lessonIndex < totalLessons; week++) {
                    for (const module of course.modules) {
                        // Check if we have not exceeded the number of lessons needed for this term
                        if (lessonIndex < module.lessons.length) {
                            termLessons.push(module.lessons[lessonIndex]);
                            lessonIndex++;
                            // Stop if we have assigned enough lessons for this term
                            if (termLessons.length >= termLessonsCount) {
                                break;
                            }
                        } else {
                            break;
                        }
                    }
                    // Stop if we have assigned enough lessons for this term
                    if (termLessons.length >= termLessonsCount) {
                        break;
                    }
                }
    
                // Return the updated term with assigned lessons
                return { ...term, lessons: termLessons };
            });
    
            // Update the class template with the new terms
            _class.terms = updatedTerms;
            
            try {
                // Save the updated class template to the database
                await _class.save();
            } catch (err: any) {
                // Log any errors that occur during the save operation
                console.error('Failed to save class:', err.message);
                return;
            }
        }
    }
    
};