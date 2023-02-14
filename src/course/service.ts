import Course from './model';
import { ICourseCreate, ICourseEdit, ICourseView, ILesson, IModule } from './interfaces';
import { uploadFile } from '../helpers/fileUploader';
import { handleError } from '../helpers/handleError';
import { UPLOADS } from '../config/constants';
import { randomUUID } from 'crypto';
// import { getVideoDurationInSeconds } from 'get-video-duration';
import path from 'path';
import mongoose from 'mongoose';
import { formatTimestamp, getVideoDurationInSeconds } from '../helpers/utility';
import { Learner } from '../user/models';

export const courseService = {
    async list(criteria: object): Promise<ICourseView[]> {
        const foundCourses = await Course.find(criteria);

        const courses = foundCourses.map(rawCourse => {
            const course = rawCourse.toJSON();
            const { modules, courseModuleDetails: { lesson_count, duration } } = this.getDetailsForCourseModules(course.modules);

            return {
                ...course,
                modules,
                lesson_count,
                duration: formatTimestamp(duration)
            };
        });

        return courses;
    },


    async view(criteria: object) {
        const rawCourse = await this.findOne(criteria);
        if (!rawCourse) throw new handleError(404, 'Course not found');

        const course = rawCourse.toJSON();
        const { modules, courseModuleDetails: { lesson_count, duration } } = this.getDetailsForCourseModules(course.modules!);

        return {
            ...course,
            modules,
            lesson_count,
            duration: formatTimestamp(duration)
        };
    },

    async findOne(criteria: object): Promise<ICourseView | null> {
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


    async createModule(courseId: string, module: IModule) {
        const course = await Course.findOneAndUpdate(
            { _id: courseId },
            {
                $push: {
                    "modules": module
                }
            }, { new: true });

        if (!course) throw new handleError(400, 'Course not found');

        const newModule = course.modules?.find((mod: IModule) => String(mod.title) === String(module.title));
        return { ...newModule.toJSON() };
    },


    async addLesson(courseId: string, moduleId: string, lesson: ILesson): Promise<Boolean> {
        const course = await this.view({ _id: courseId, "modules._id": moduleId });
        if (!course) throw new handleError(404, 'Course or module not found');

        // upload lesson video
        let video_url: String;
        // if (lesson.lesson_video) {
        //     const key = `${UPLOADS.lesson_videos}/${courseId}-${lesson.title.split(' ').join('-')}${path.extname(lesson.lesson_video.name)}`;
        //     video_url = await uploadFile(lesson.lesson_video, key);
        //     lesson.lesson_video = video_url;
        //     const duration = await getVideoDurationInSeconds(String(video_url));
        //     lesson.duration = Math.round(duration);
        // }
        const duration = await getVideoDurationInSeconds(String(lesson.lesson_video));
        lesson.duration = Math.round(duration);

        await Course.updateOne(
            { _id: courseId, "modules._id": moduleId },
            {
                $push: {
                    "modules.$.lessons": lesson
                }
            }
        );
        return true;
    },


    async listModuleLessons(courseId: string, moduleId: string) {
        const course = await this.findOne({ _id: courseId, "modules._id": moduleId });
        if (!course) throw new handleError(404, 'Course or module not found');

        return course.modules?.find((module: IModule) => String(module._id) === String(moduleId));
    },


    getDetailsForCourseModules(courseModules: IModule[]) {
        let courseModuleDetails = {
            lesson_count: 0,
            duration: 0
        };
        const modules = courseModules.map((module: IModule) => {
            const lesson_count = module.lessons?.length ?? 0;
            const lessonDuration = module.lessons?.reduce((totalDuration: number, lesson: ILesson) => totalDuration + (lesson.duration ?? 0), 0) as unknown as number;

            courseModuleDetails.lesson_count += lesson_count;
            courseModuleDetails.duration += lessonDuration;

            // module.id = module._id;
            // delete module._id;
            return {
                ...module,
                lesson_count,
                duration: formatTimestamp(lessonDuration),
            }
        });

        return { modules, courseModuleDetails };
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
