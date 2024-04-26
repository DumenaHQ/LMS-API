import Class, { ClassTemplate, IClass, IAddLearner, EStatus, ITemplate } from './model';
import Course from '../course/model';
import { Learner } from '../user/models';
import { handleError } from '../helpers/handleError';
import mongoose from 'mongoose';
import { ICourseView } from '../course/interfaces';
import { courseService } from '../course/service';
import { userService } from '../user/service';
import { USER_TYPES, UPLOADS, ORDER_ITEMS, TERMS } from '../config/constants';
import { uploadFile } from '../helpers/fileUploader';
import { lmsBucketName } from '../config/config';
const { BUCKET_NAME: lmsBucket } = lmsBucketName;
import path from 'path';
import { quizService } from '../quiz/service';
import { orderService } from '../order/service';

const classOrTemplateModel = {
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
        // Automatically add 1st,2nd,3rd term
        try {
            const defaultTerms = [
                {
                    ...TERMS.first_term
                    
                },
                {
                    ...TERMS.second_term
                    
                },
                {
                    ...TERMS.third_term
                    
                }
            ];

            const klass = new Class({
                ...classData,
                terms: defaultTerms
            });

            await klass.save();

            return klass;
        } catch (error) {

            throw new handleError(400, 'Error Creating new class, class with name already exist');
        }
    },

    async createTemplate(templateData: ITemplate) {
        // Automatically add 1st,2nd,3rd term
        const defaultTerms = [
            {
                ...TERMS.first_term
                            
            },
            {
                ...TERMS.second_term
                            
            },
            {
                ...TERMS.third_term
                            
            }
        ];
        
        const klassTemplate = new ClassTemplate({
            ...templateData,
            terms: defaultTerms
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

    async viewTemplate(criteria: object): Promise<ITemplate> {
        const template = await ClassTemplate.findOne({ deleted: false, status: EStatus.Active, ...criteria });
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

        if (klass){
            let active_term;
            const _class = klass.toJSON();

            if (klass.terms && klass.terms.length > 0){
                active_term = this.getClassActiveTerm(klass.terms);
                _class.active_term = active_term;
            }
            return _class;
        }
        return klass;
    },


    async view(criteria: object | string): Promise<IClass | null> {
        let classroom: any;
        if (typeof criteria == 'object')
            classroom = await this.findOne(criteria);
        else {
            classroom = await this.findOne({ _id: criteria });
        }
        if (!classroom) {
            throw new handleError(404, 'Class not found');
        }
        // classroom = classroom.toJSON();

        // fetch full learner details
        classroom.learners = await userService.list({
            'user._id': { $in: classroom.learners.map((learner: { user_id: string }) => learner.user_id) },
            'user.deleted': false
        }, 'learner');
        classroom.learner_count = classroom.learners && classroom.learners.length || 0;

        // fetch course details
        const courses = classroom.template ? classroom.template.courses : classroom.courses;
        classroom.course_count = courses.length;
        classroom.courses = await courseService.list({ _id: { $in: courses } });

        // fetch teacher details
        let teacher;
        if (classroom.teacher_id) {
            teacher = await userService.view({ _id: classroom.teacher_id });
            teacher = {
                id: teacher.id,
                fullname: teacher.fullname,
                email: teacher.email
            };
        }
        return { ...classroom, teacher };
    },

    async viewClass(classId: string, { id, role }: { id: string, role: string }): Promise<IClass | null> {
        const defaultParam: any = { _id: new mongoose.Types.ObjectId(classId) };

        const criteria = {
            [USER_TYPES.learner]: { ...defaultParam, 'learners.user_id': id },
            [USER_TYPES.school]: { ...defaultParam, school_id: id },
            [USER_TYPES.parent]: { ...defaultParam, parent_id: id },
            [USER_TYPES.instructor]: { ...defaultParam, teacher_id: id },
            [USER_TYPES.admin]: defaultParam
        };
        return this.view(criteria[role]);
    },


    async list(criteria: object): Promise<any[] | []> {
        const classes = await Class.find({ ...criteria, status: EStatus.Active, deleted: false })
            .populate({ path: 'template' }).sort({ createdAt: 'desc' });

        return classes.map((klas: any) => {
            const _class = klas.toJSON();
            _class.learner_count = klas.learners.length;
            if (klas.template) {
                _class.course_count = _class.template.courses?.length;
            } else {
                _class.course_count = klas?.courses?.length;
            }

            _class.active_term = this.getClassActiveTerm(klas.terms);
            delete _class.learners;
            delete _class.courses;
            delete _class.template;
            return _class;
        });
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

        const addedLearnerIds = _class.learners.map((learner: IAddLearner) => String(learner.user_id));

        const validatedLearners = (await Promise.all(learners.map(async (learner: IAddLearner) => {
            const user = await Learner.findOne({
                $or: [{ _id: learner.user_id }, { 'user': learner.user_id }]
            });
            return user ? { user_id: user.user } : null;
        }))).filter((learner) => learner);

        const learnersToAdd = validatedLearners.filter((learner: any) => {
            return !addedLearnerIds.includes(String(learner.user_id));
        });

        _class.learners = [..._class.learners, ...learnersToAdd];
        await _class.save();

        //
        // TODO
        // -----
        // Detect and return learners already added to class
    },


    async removeTeacherFromClass(classId: string): Promise<void> {
        const query = await Class.findByIdAndUpdate(classId, { $set: { teacher_id: null } });
        if (!query) {
            throw new handleError(400, 'Invalid class ID');
        }
    },

    async listClassesForRoles(userId: string, role: string) {
        const criteria = {
            [USER_TYPES.learner]: { 'learners.user_id': userId },
            [USER_TYPES.school]: { school_id: userId },
            [USER_TYPES.parent]: { parent_id: userId },
            [USER_TYPES.instructor]: { teacher_id: userId },
            [USER_TYPES.admin]: {}
        };
        return this.list(criteria[role]);
    },

    async update(classId: string, data: Record<string, unknown>,  files: File): Promise<any> {
        const { teacher_id } = data;
        if (teacher_id) {
            const teacher = await userService.findOne({ _id: teacher_id });
            if (!teacher || teacher.role !== 'instructor') {
                throw new handleError(400, 'Invalid teacher ID');
            }
        }

        const klass = await Class.findById(classId);
        if (!klass){
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
        


        let active_term;
        if (data.active_term_start_date && data.active_term_end_date){
            active_term = this.getClassActiveTerm(klass.terms);
            if (active_term){
                active_term =  {
                    title: active_term.title,
                    defaultDateChanged: true,
                    start_date: new Date(String(data.active_term_start_date)),
                    end_date: new Date(String(data.active_term_end_date))
                };
                const updatedTerm = klass.terms.findIndex(term => term.title === active_term.title);
                klass.terms[updatedTerm] = active_term;
                data.terms = klass.terms;   
            } 
        }

        const result = await Class.findByIdAndUpdate(classId, data, {new: true});

        return {...result._doc, active_term};
        
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
        const classLearnerIds = klass.learners.map((learner: IAddLearner) => learner.user_id);
        return quizService.listLearnersResult(quizId, classLearnerIds);
    },

    async subscribe(classId: string, userId: string, learners: []) {
        const klass = await this.findOne({ _id: classId }, false);
        const meta_data = { classId };
        const orderItems = learners.map((learner: any) => {
            const { user_id, name } = learner;
            return { order_type_id: klass?.template, user_id, name, order_type: 'class', meta_data };
        });
        return orderService.create({ items: orderItems, user: new mongoose.Types.ObjectId(userId), item_type: ORDER_ITEMS.class });
    },

    getClassActiveTerm(terms: Array<{
        title: string,
        start_date: Date,
        end_date: Date,
    }>){
        let activeTerm;

        if (terms.length === 0) {
            activeTerm = null;
            return activeTerm;
        }
        const today = new Date();
        activeTerm = terms.find(term => {
            const startDate = new Date(term.start_date);
            const endDate = new Date(term.end_date);
            return startDate <= today && today <= endDate;
        });
        if (!activeTerm){
            // activeTerm = {
            //     title: 'on break',
            //     start_date: new Date(),
            //     end_date: new Date(),
            // };
            activeTerm = null ;
            return activeTerm;

        }
        return activeTerm;
    }
};