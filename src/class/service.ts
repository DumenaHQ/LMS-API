import Class, { IClass, IAddLearner } from './model';
import User, { Learner, School } from '../user/models';
import { handleError } from '../helpers/handleError';
import mongoose, { ObjectId, Types } from 'mongoose';
import { ICourseView } from '../course/interfaces';
import { courseService } from '../course/service';
import { userService } from '../user/service';
import { IUserView } from '../user/models';
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

    async view(criteria: object | string, user: { id: string, role: string } | null): Promise<IClass | null> {
        let classroom: any;
        if (typeof criteria == "object")
            classroom = await Class.findOne(criteria);
        else {
            classroom = await Class.findById(criteria);
        }
        if (!classroom) {
            throw new handleError(404, 'Class not found');
        }
        classroom = classroom.toJSON();

        // fetch full learner details
        classroom.learner_count = classroom.learners && classroom.learners.length;
        classroom.learners = await this.fetchLearnerDetails(classroom.learners || [], user);

        // fetch course details
        classroom.courses = await courseService.list({ _id: { $in: classroom.courses } });

        return classroom;
    },


    async list(criteria: object): Promise<any[] | []> {
        const classes = await Class.find(criteria);
        return classes.map((klas: IClass) => {
            const _class = klas.toJSON();
            _class.learner_count = klas.learners.length;
            _class.course_count = klas?.courses?.length;
            delete _class.learners;
            return _class;
        });
    },


    async addCourses(ClassId: string, courseIds: [string]): Promise<void> {
        const _class = await Class.findById(ClassId);

        if (!_class) {
            throw new handleError(400, 'Invalid class ID');
        }

        const courses = new Set([..._class.courses, ...courseIds]);
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


    async addLearners(classId: string, learners: [IAddLearner]): Promise<void> {
        const _class = await Class.findById(classId);
        if (!_class) {
            throw new handleError(400, 'Invalid class ID');
        }

        const addedLearnerIds = _class.learners.map((learner: IAddLearner) => String(learner.user_id));

        const validatedLearners = await Promise.all(learners.map(async (learner: IAddLearner) => {
            if (learner.user_id) {
                const foundLearner = await Learner.findById(learner.user_id).populate({ path: 'user' });
                return foundLearner.user;
            }
            return User.findOne({ username: learner.username });
        }));

        const learnersToAdd = validatedLearners.filter((learner: any) => {
            return learner && !addedLearnerIds.includes(String(learner._id));
        }).map(learner => ({ user_id: learner?._id }));

        _class.learners = [..._class.learners, ...learnersToAdd];
        await _class.save();

        //
        // TODO
        // -----
        // Detect and return learners already added to class
    },


    async fetchLearnerDetails(learners: IAddLearner[], user: { id: string, role: string }): Promise<IUserView[] | []> {
        let learnerIds;
        switch (user.role) {
            case USER_TYPES.learner:
                return [];
            case USER_TYPES.admin:
                learnerIds = learners.map(learner => learner.user_id);
                break;
            case USER_TYPES.school:
            default:
        }
        return userService.list({ 'user._id': { $in: learnerIds } }, 'learner');
    },

    async update(classId: string, data: object): Promise<void> {
        Class.updateOne({ _id: new mongoose.Types.ObjectId(classId) }, data);
    },

    async delete(classId: string): Promise<void> {
        Class.updateOne({ _id: new mongoose.Types.ObjectId(classId) }, { deleted: true });
    }
}