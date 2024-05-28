import { body } from 'express-validator';
import useragent from 'useragent'; // to understand more, visit https://www.npmjs.com/package/useragent

import { EActivityType } from '../../activity/enums';
import { validate } from './validate';
import { AuthenticationActivityType, ClassroomActivityType, ClickActivityType, LessonActivityType, QuizActivityType } from '../../activity/types';
import { classService } from '../../class/service';
import { quizService } from '../../quiz/service';





export default validate;

export const activityCreationRules = () => {
    return [
        body('activity_name').isString().withMessage('Activity name must be a string').isIn(Object.values(EActivityType)).withMessage(`Invalid activity name, choose from any of these: [${Object.values(EActivityType).join(', ')}]`),
        body('activity').isObject().withMessage('Invalid activity, must be an object'),
        body('activity').custom(async (activity: any, { req }) => {
            if (!req.headers) throw new Error('Something is wrong with this request, so we cant process it. Please verify you are sending this request with a header');
           
            // access the origin ip address of the request, also handles scenario where the backend is behind a proxy
            const ip = req.headers['x-forwarded-for']?.split(',').shift() || req.socket.remoteAddress;

            // access device information
            const agent = useragent.lookup(req.headers['user-agent']);
            const device = `DEVICE:${agent.device.toString()}. OPERATING_SYSTEM:${agent.os.toString()}. BROWSER:${agent.toString()}`;

            // access the activity_name field in the request body
            const { activity_name } = req.body;

            // AUTHENTICATION ACTIVITY
            if (activity_name === EActivityType.Authentication) {
                // make sure the req.body.activity.type value is in the enum AuthenticationActivityType
                if (!Object.values(AuthenticationActivityType).includes(activity.type)) {
                    throw new Error(`Invalid authentication activity type, choose from any of these: [${Object.values(AuthenticationActivityType).join(', ')}]`);
                }
                // modify the req.body.activity object to match the AuthenticationActivity type
                req.body.activity = {
                    type: activity.type,
                    timestamp: new Date().toISOString(),
                    details:{
                        ip,
                        device,
                    }
                };
                return true;
            }

            // CLASSROOM ACTIVITY
            else if (activity_name === EActivityType.Classroom) {
                // make sure the req.body.activity.type value is in the enum ClassroomActivityType
                if (!Object.values(ClassroomActivityType).includes(activity.type)) {
                    throw new Error(`Invalid classroom activity type, choose from any of these: [${Object.values(ClassroomActivityType).join(', ')}]`);
                }

                // confirm the class room id is given and is correct
                if (!activity.classroom.id) throw new Error('Classroom ID must be provided');
                const classroom = await classService.findOne({ _id: activity.classroom.id });
                if (!classroom) throw new Error('Classroom not found');

                // modify the req.body.activity object to match the ClassroomActivity type
                req.body.activity = {
                    type: activity.type,
                    classroom:{
                        id: activity.classroom.id,
                        name: classroom.name
                    },
                    timestamp: new Date().toISOString(),
                    details:{
                        ip,
                        device,
                    }
                };
                return true;
            }

            // LESSON ACTIVITY
            else  if (activity_name === EActivityType.Lesson) {
                // make sure the req.body.activity.type value is in the enum LessonActivityType
                if (!Object.values(LessonActivityType).includes(activity.type)) {
                    throw new Error(`Invalid lesson activity type, choose from any of these: [${Object.values(EActivityType).join(', ')}]`);
                }

                // confirm lesson id & title and has_video is given, throw error if not
                if (!activity.lesson.id) throw new Error('Lesson id must be provided');
                if (!activity.lesson.title) throw new Error('Lesson title must be provided');
                if (!activity.lesson.has_video) throw new Error('Lesson has_video must be provided');
                
                // confirm has_video is boolean, if not throw an error
                if (typeof activity.lesson.has_video !== 'boolean') throw new Error('Invalid has_video, must be a boolean');

                // if lesson has_video is true
                if (activity.lesson.has_video === true) {
                    if (!activity.lesson.video_url) throw new Error('Since lesson is a video / has a video, Lesson video_url must be provided');
                    if (!activity.lesson.video_timestamp) throw new Error('Since lesson is a video / has a video, Lesson video_timestamp must be provided');
                    // make sure the videon timestamp is a number
                    if (typeof activity.lesson.video_timestamp !== 'number') throw new Error('Invalid video_timestamp, must be a number, video_timestamp must be in seconds');
                }
                
                // modify the req.body.activity object to match the LessonActivity type
                req.body.activity = {
                    type: activity.type,
                    timestamp: new Date().toISOString(),
                    lesson:{
                        id: String(activity.lesson.id),
                        title: String(activity.lesson.title),
                        has_video: activity.lesson.has_video,
                        video_url: activity.lesson.video_url,
                        video_timestamp: activity.lesson.video_timestamp // At what point in the video, the video was paused, started, stopped, completed
                    },
                    details:{
                        ip,
                        device,
                    }
                };
                return true;
            }

            // QUIZ ACTIVITY
            else   if (activity_name === EActivityType.Quiz) {
                // make sure the req.body.activity.type value is in the enum QuizActivityType
                if (!Object.values(QuizActivityType).includes(activity.type)) {
                    throw new Error(`Invalid quiz activity type, choose from any of these: [${Object.values(QuizActivityType).join(', ')}]`);
                }

                // confirm the quiz id is given and is correct
                if (!activity.quiz.id) throw new Error('Quiz ID must be provided');
                const quiz = await quizService.findOne({ _id: activity.quiz.id });
                if (!quiz) throw new Error('Quiz not found');

                // modify the req.body.activity object to match the QuizActivity type
                req.body.activity = {
                    type: activity.type,
                    quiz:{
                        id: activity.quiz.id,
                        title: quiz.title
                    },
                    timestamp: new Date().toISOString(),
                    details:{
                        ip,
                        device,
                    }
                };
                return true;
            }

            // CLICK ACTIVITY
            else   if (activity_name === EActivityType.Click) {
                // make sure the req.body.activity.type value is in the enum ClickActivityType
                if (!Object.values(ClickActivityType).includes(activity.type)) {
                    throw new Error(`Invalid click activity type, choose from any of these: [${Object.values(ClickActivityType).join(', ')}]`);
                }

                // make sure the activity.url is given
                if (!activity.url) throw new Error('actiivity url must be provided');

                // modify the req.body.activity object to match the ClickActivity type
                req.body.activity = {
                    type: activity.type,
                    timestamp: new Date().toISOString(),
                    url: String(activity.url),
                    details:{
                        ip,
                        device,
                    }
                };
                return true;
            }

            else {throw new Error('Invalid activity name');}
        
        })
    ];
};
