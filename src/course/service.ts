import Course from './model';
import { ICourseCreate, ICourseEdit, ICourseView, ILesson, IModule } from './interfaces';
import { uploadFile } from '../helpers/fileUploader';
import { handleError } from '../helpers/handleError';
import { UPLOADS } from '../config/constants';
import { randomUUID } from 'crypto';
import path from 'path';
import mongoose from 'mongoose';
import { formatTimestamp, getVideoDurationInSeconds } from '../helpers/utility';
import { Learner } from '../user/models';
import { lmsBucketName } from '../config/config';
const { BUCKET_NAME: lmsBucket } = lmsBucketName;

export const courseService = {
    async list(criteria: object): Promise<ICourseView[]> {
        const foundCourses = await Course.find(criteria).sort({ createdAt: 'desc' });

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
            thumb_url = await uploadFile(lmsBucket, course.thumb_photo, key);
            course.thumb_url = thumb_url;
        }
        if (!course.access_scopes) course.access_scopes = ['free'];
        return courseId ? Course.findByIdAndUpdate(courseId, course, { new: true }) : Course.create(course);
    },


    async createModule(courseId: string, module: IModule) {

        function parseData(module: IModule) {
            return {
                objectives: JSON.stringify(module.objectives),
                class_activities: JSON.stringify(module.class_activities),
                further_reading_links: JSON.stringify(module.further_reading_links)
            }
        }

        const { objectives, class_activities, further_reading_links } = parseData(module);

        const course = await Course.findOneAndUpdate(
            { _id: courseId },
            {
                $push: {
                    "modules": {
                        ...module,
                        objectives,
                        class_activities,
                        further_reading_links
                    }
                }
            }, { new: true });

        if (!course) throw new handleError(400, 'Course not found');

        const newModule = course.modules?.find((mod: IModule) => String(mod.title) === String(module.title));
        return {
            ...newModule.toJSON(),
            objectives,
            class_activities,
            further_reading_links
        };
    },


    async addLesson(courseId: string, moduleId: string, lesson: ILesson): Promise<Boolean> {
        const course = await this.view({ _id: courseId, "modules._id": moduleId });
        if (!course) throw new handleError(404, 'Course or module not found');

        if (String(lesson.has_video).toLowerCase() == 'true') {
            if (!lesson.lesson_video) {
                throw new handleError(400, 'No video file specified');
            }
            if (typeof lesson.lesson_video !== 'string') {
                const key = `${UPLOADS.lesson_videos}/${courseId}-${lesson.title.split(' ').join('-')}${path.extname(lesson.lesson_video.name)}`;
                lesson.lesson_video = await uploadFile(lmsBucket, lesson.lesson_video, key);
            }
            const duration = await getVideoDurationInSeconds(String(lesson.lesson_video));
            lesson.duration = Math.round(duration);
        }

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
            const lessonDuration = module.lessons?.reduce((totalDuration: number, lesson) => {
                return totalDuration + Number(lesson.duration || 0);
            }, 0);

            courseModuleDetails.lesson_count += lesson_count;
            courseModuleDetails.duration += lessonDuration || 0;

            return {
                ...module,
                objectives: JSON.parse(module.objectives as string || "{}"),
                class_activities: JSON.parse(module.class_activities as string || "{}"),
                further_reading_links: JSON.parse(module.further_reading_links as string || "{}"),
                lesson_count,
                duration: formatTimestamp(lessonDuration || 0),
            }
        });

        return { modules, courseModuleDetails };
    },


    async listByUserType(userType: string, userId: string): Promise<ICourseView[]> {
        let queryCriteria = {};

        switch (userType) {
            case 'learner':
                queryCriteria = await this.prepareUserCoursesCriteria(userId);
                break;
            case 'admin':
            default:
        }
        return this.list({ ...queryCriteria, deleted: false });
    },


    async prepareUserCoursesCriteria(userId: string): Promise<{}> {
        const access = await Learner.findOne({ user: new mongoose.Types.ObjectId(userId) }).select('-_id content_access');
        const accessSlugs = access.content_access.map((a: { slug: any; }) => a.slug);
        return { access_scopes: { $in: [...accessSlugs, 'free'] } };
    }
}
