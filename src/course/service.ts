import Course from './model';
import { ICourseCreate, ICourseEdit, ICourseView, ILesson, IQuiz } from './interfaces';
import { uploadFile } from '../helpers/fileUploader';
import { handleError } from "../helpers/handleError";
import { UPLOADS } from '../config/constants';
import { randomUUID } from 'crypto';
import path from 'path';
import mongoose from 'mongoose';
import { ContentAccess } from '../subscription/model';

export const courseService = {
    async list(criteria: object): Promise<ICourseView[]> {
        return Course.find(criteria).select({ lessons: 0, quizzes: 0 });
    },

    async view(criteria: object): Promise<ICourseView | null> {
        return Course.findOne(criteria);
    },


    async save(course: ICourseCreate | ICourseEdit, courseId?: String): Promise<ICourseView> {
        let thumb_url;

        if (course.thumb_photo) {
            const key = `${UPLOADS.course_thumbs}/${randomUUID()}${path.extname(course.thumb_photo.name)}`;
            thumb_url = await uploadFile(course.thumb_photo, key);
            course.thumb_url = thumb_url;
        }
        return courseId ? Course.findByIdAndUpdate(courseId, course, { new: true }) : Course.create(course);
    },


    async addLesson(courseId: String, newLesson: ILesson): Promise<ILesson> {
        const course = await this.view({ _id: courseId });
        if (!course) throw new handleError(404, 'Course not found');

        const lessonData: any = { ...newLesson };

        // upload lesson video
        let video_url;
        if (newLesson.lesson_video) {
            const key = `${UPLOADS.lesson_videos}/${randomUUID()}${path.extname(newLesson.lesson_video.name)}`;
            video_url = await uploadFile(newLesson.lesson_video, key);
            lessonData.video_url = video_url;
        }

        course?.lessons?.push(lessonData);
        await course.save();
        return lessonData;
    },


    async addQuizToCourse(courseId: string, quiz: IQuiz): Promise<IQuiz> {
        if (!quiz.title) throw new handleError(400, 'Quiz must have a title');

        const course = await this.view({ _id: courseId });

        if (!course) throw new handleError(404, 'Course not found');

        course.quizzes.push(quiz);

        await course.save();
        const newQuiz = course.quizzes.find(_quiz => String(_quiz.title) == String(quiz.title));
        return newQuiz;
    },


    async listByUserType(userType: string, userId: string): Promise<ICourseView[]> {
        const criteria = { deleted: false };
        let queryCriteria = {};

        switch (userType) {
            case 'learner':
                queryCriteria = await this.prepareUserCoursesCriteria(userId);
                break;
            case 'admin':
            default:
        }

        return this.list({ ...criteria, ...queryCriteria });
    },


    async prepareUserCoursesCriteria(userId: string): Promise<{}> {
        const access = await ContentAccess.find({ user: new mongoose.Types.ObjectId(userId) }).select('-_id slug');
        const accessSlugs = access.map(a => a.slug);
        // const accessSlugs = await Subscription.find({ _id: { $in: accessIds } }).select('-_id slug');
        return { access_scopes: { $in: accessSlugs.map(a => a.slug) } };
    }
}
