import Course from './model';
import { ICourseCreate, ICourseEdit, ICourseView, ILesson } from './interfaces';
import { uploadFile } from '../helpers/fileUploader';
import { handleError } from '../helpers/handleError';
import { UPLOADS } from '../config/constants';
import { randomUUID } from 'crypto';
import { getVideoDurationInSeconds } from 'get-video-duration';
import path from 'path';
import mongoose from 'mongoose';
import { formatTimestamp } from '../helpers/utility';
import { Learner } from '../user/models';

export const courseService = {
    async list(criteria: object): Promise<ICourseView[]> {
        const foundCourses = await Course.find(criteria).select({ quizzes: 0 });

        const courses = foundCourses.map(course => {
            const courseDuration = course.lessons?.reduce((totalDuration: number, lesson: ILesson) => totalDuration + (lesson.duration ?? 0), 0);
            const lesson_count = course.lessons?.length;
            return { ...course.toJSON(), lesson_count, duration: formatTimestamp(courseDuration) };
        });

        return courses;
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
        if (!course.access_scopes) course.access_scopes = ['free'];
        return courseId ? Course.findByIdAndUpdate(courseId, course, { new: true }) : Course.create(course);
    },


    async addLesson(courseId: String, lesson: ILesson): Promise<ILesson> {
        const course = await this.view({ _id: courseId });
        if (!course) throw new handleError(404, 'Course not found');

        // upload lesson video
        let video_url: String;
        if (lesson.lesson_video) {
            const key = `${UPLOADS.lesson_videos}/${courseId}-${lesson.title.split(' ').join('-')}${path.extname(lesson.lesson_video.name)}`;
            video_url = await uploadFile(lesson.lesson_video, key);
            lesson.lesson_video = video_url;
            const duration = await getVideoDurationInSeconds(String(video_url));
            lesson.duration = Math.round(duration);
        }

        course?.lessons?.push(lesson);
        await course.save();
        return lesson;
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
        const access = await Learner.findOne({ user: new mongoose.Types.ObjectId(userId) }).select('-_id content_access');
        const accessSlugs = access.content_access.map((a: { slug: any; }) => a.slug);
        return { access_scopes: { $in: [...accessSlugs, 'free'] } };
    }
}
