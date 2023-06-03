import Class, { IClass, IAddLearner, EStatus } from './model';
import Course from '../course/model';
import User, { Learner } from '../user/models';
import { handleError } from '../helpers/handleError';
import mongoose from 'mongoose';
import { ICourseView } from '../course/interfaces';
import { courseService } from '../course/service';
import { userService } from '../user/service';
import { USER_TYPES, UPLOADS } from '../config/constants';
import { uploadFile } from '../helpers/fileUploader';
import { lmsBucketName } from '../config/config';
const { BUCKET_NAME: lmsBucket } = lmsBucketName;
import path from 'path';

export const classService = {
    async create(classData: IClass, files: File): Promise<IClass> {
        const { thumbnail, header_photo }: any = files || {};
        if (thumbnail) {
            const thumbKey = `${UPLOADS.class_thumbs}/${classData.name.split(' ').join('-')}${path.extname(thumbnail.name)}`;
            classData.thumbnail = await uploadFile(lmsBucket, thumbnail, thumbKey);
        }
        if (header_photo) {
            const photoKey = `${UPLOADS.class_header_photos}/${classData.name.split(' ').join('-')}${path.extname(header_photo.name)}`;
            classData.header_photo = await uploadFile(lmsBucket, header_photo, photoKey);
        }
        return Class.create(classData);
    },


    async findOne(criteria: object): Promise<IClass | null> {
        return Class.findOne({ ...criteria, deleted: false, status: EStatus.Active });
    },


    async view(criteria: object | string): Promise<IClass | null> {
        let classroom: any;
        if (typeof criteria == "object")
            classroom = await this.findOne(criteria);
        else {
            classroom = await this.findOne({ _id: criteria });
        }
        if (!classroom) {
            throw new handleError(404, 'Class not found');
        }
        classroom = classroom.toJSON();

        // fetch full learner details
        classroom.learner_count = classroom.learners && classroom.learners.length;
        classroom.learners = await userService.list({ 'user._id': { $in: classroom.learners } }, 'learner');

        // fetch course details
        classroom.course_count = classroom.courses.length;
        classroom.courses = await courseService.list({ _id: { $in: classroom.courses } });

        return classroom;
    },

    async viewClass(classId: string, { id, role }: { id: string, role: string }): Promise<IClass | null> {
        let criteria: any = { _id: classId };

        switch (role) {
            case USER_TYPES.admin:
                criteria = { ...criteria };
                break;
            case USER_TYPES.school:
                criteria = { ...criteria, school_id: id };
                break;
            case USER_TYPES.learner:
            default:
                criteria = {};
        }
        return this.view(criteria);
    },


    async list(criteria: object): Promise<any[] | []> {
        const classes = await Class.find({ ...criteria, status: EStatus.Active, deleted: false });
        return classes.map((klas: IClass) => {
            const _class = klas.toJSON();
            _class.learner_count = klas.learners.length;
            _class.course_count = klas?.courses?.length;
            delete _class.learners;
            delete _class.courses;
            return _class;
        });
    },


    async addCourses(ClassId: string, courseIds: [string]): Promise<void> {
        const _class = await Class.findById(ClassId);

        if (!_class) {
            throw new handleError(400, 'Invalid class ID');
        }

        const validatedCourses = await Promise.all(courseIds.map(async (courseId: string) => {
            const foundCourse = await Course.findById(courseId).select('_id');
            return foundCourse ? String(foundCourse._id) : null;
        }));
        const validatedCourseIds = validatedCourses.filter((course) => course);
        const courses = new Set([..._class.courses, ...validatedCourseIds]);
        _class.courses = Array.from(courses);
        await _class.save();
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
        const _class = await this.findOne({ _id: classId });
        if (!_class) {
            throw new handleError(400, 'Invalid class ID');
        }

        const addedLearnerIds = _class.learners.map((learner: IAddLearner) => String(learner.user_id));

        const validatedLearners = await Promise.all(learners.filter(async (learner: IAddLearner) => {
            const foundLearner = await Learner.findById(learner.user_id).populate({ path: 'user' });
            return foundLearner;
        }));

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

    async listClassesForRoles(userId: string, role: string) {
        switch (role) {
            case USER_TYPES.learner:

            case USER_TYPES.school:
                return this.list({ school_id: userId });
            case USER_TYPES.admin:
                return this.list({});
            default:
        }
    },

    async update(classId: string, data: object): Promise<void> {
        Class.updateOne({ _id: new mongoose.Types.ObjectId(classId) }, data);
    },

    async delete(classId: string): Promise<void> {
        Class.updateOne({ _id: new mongoose.Types.ObjectId(classId) }, { deleted: true });
    }
}