import Quiz, { QuizLevelType, EQuizLevel } from './models';
import Course from '../course/model';
import { IModule, ILesson } from '../course/interfaces';
import { IQuiz, IQuizQuestion, IQuizAnswer } from './interfaces';
import { handleError } from '../helpers/handleError';
import mongoose from 'mongoose';
import { userService } from '../user/service';

export const quizService = {
    async create(quiz: IQuiz): Promise<IQuiz> {
        //if (!quiz.title) throw new handleError(400, 'Quiz must have a title');
        const { course_id, module_id, lesson_id, ...quizData } = quiz;
        const course = await Course.findOne({ _id: course_id, 'modules._id': module_id });
        if (!course) throw new handleError(400, 'Course not found');

        if (module_id && lesson_id) {
            const module = course.modules.find((module: IModule) => module._id == module_id);
            const lesson = module.lessons.find((lesson: ILesson) => lesson._id == lesson_id);
            quizData.title = `${module.title.split(' ').join('-')}: ${lesson.title.split(' ').join('-')}`;
        }

        let quiz_level = EQuizLevel.Course;
        if (lesson_id) quiz_level = EQuizLevel.Lesson;
        else if (module_id) quiz_level = EQuizLevel.Module; 

        const newQuiz = await Quiz.create({ ...quizData, course_id, quiz_level }) as unknown as IQuiz;
   
        await this.attachQuiz(newQuiz._id, course_id, quiz_level, module_id, lesson_id);   
        return newQuiz;
    },

    async attachQuiz(quizId: string, courseId: string, quiz_level: QuizLevelType, module_id: string, lesson_id: string): Promise<void> {
        // const [quiz, course] = await Promise.all([
        //     Quiz.findById(quizId),
        //     Course.findById(courseId)
        // ]);

        // if (!quiz) throw new handleError(400, 'Quiz not found');
        // if (!course) throw new handleError(400, 'Course not found');

        const filter = {
            course: { _id: courseId },
            module: { _id: courseId, 'modules._id': module_id },
            lesson: { _id: courseId }
        };

        const updateData = {
            course: { quiz_id: quizId },
            module: { 'modules.$.quiz_id': quizId },
            lesson: { 'modules.$[el1].lessons.$[el2].quiz_id': quizId }
        };

        const arrayFilters = {
            course: [],
            module: [],
            lesson: [{ 'el1._id': module_id }, { 'el2._id': lesson_id }]
        };

        await Course.findOneAndUpdate(
            filter[quiz_level as keyof unknown],
            { $set: updateData[quiz_level as keyof unknown] },
            { arrayFilters: arrayFilters[quiz_level as keyof unknown] }
        );
    },


    async view(criteria: object): Promise<IQuiz> {
        const quiz = await this.findOne(criteria) as IQuiz;
        if (!quiz) throw new handleError(404, 'Quiz not found');

        return quiz;
    },

    async list(criteria: object): Promise<unknown[]> {
        const quizes = await Quiz.find(criteria).select('-answers').sort({ createdAt: 'desc' });
        return quizes.map((rawQuiz: Record<string, any>) => {
            const quiz = rawQuiz.toJSON();
            const questions = quiz.questions;
            delete quiz.questions;
            return { ...quiz, question_count: questions.length };
        });
    },

    async findOne(criteria: object): Promise<IQuiz> {
        return Quiz.findOne(criteria).select('-answers') as unknown as IQuiz;
    },

    async updateQuiz(quizId:string, quizData: IQuiz) {
        return Quiz.findOneAndUpdate(
            { _id: quizId },
            quizData
        );
    },

    async deleteQuiz(quizId: string) {
        return Quiz.deleteOne({ _id: quizId });
    },

    async saveQuizQuestions(quizId: string, questions: IQuizQuestion[]) {
        const quiz = await Quiz.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(quizId) },
            {
                $push: {
                    'questions': { $each: questions }
                }
            }
        );
        if (!quiz) throw new handleError(400, 'Quiz not found');
    },

    async updateQuizQuestion(quizId: string, questionId: string, questionData: IQuizQuestion) {
        const criteria = { _id: quizId, 'questions._id': questionId };
        const quiz = await this.view(criteria);
        const qq: IQuizQuestion = quiz.questions?.find((question: IQuizQuestion) => question._id == questionId)!;
        const { question, optA, optB, optC, optD, optE, answer } = questionData;
        return Quiz.findOneAndUpdate(
            criteria,
            { $set: {
                'question.$.question': question || qq.question,
                'question.$.optA': optA || qq.optA,
                'question.$.optB': optB || qq.optB,
                'question.$.optC': optC || qq.optC,
                'question.$.optD': optD || qq.optD,
                'question.$.optE': optE || qq.optE,
                'question.$.answer': answer || qq.answer,
            }}
        );
    },

    async saveAnswers(quizId: string, user: { userId: string, school_id: string }, selectedOpts: { question_id: string, selected_ans: string }[]) {
        const { school_id, userId: learner } = user;
        const quiz = await Quiz.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(quizId) },
            {
                $push: {
                    'answers': {
                        learner,
                        school_id,
                        answers: selectedOpts
                    }
                }
            }
        );
        if (!quiz) throw new handleError(400, 'Quiz not found');
    },


    async computeLearnerResult(quizId: string, learnerId: string) {
        const quiz = await Quiz.findOne({ _id: quizId });
        if (!quiz) throw new handleError(404, 'Quiz not found');

        const learnerAnswers = quiz.answers?.find((answer: Record<string, unknown>) => String(answer.learner) === String(learnerId));
        if (!learnerAnswers) throw new handleError(400, 'This Learner hasn\'t taken the quiz yet');

        const { answers }: any = learnerAnswers;
        const quizScore = quiz.questions?.reduce((score: number, question: Record<string, unknown>) => {
            const questAns = answers.find((answer: Record<string, unknown>) => String(answer.question_id) === String(question.id));
            if (questAns && questAns.selected_ans == question.answer) {
                return ++score;
            }
            return score;
        }, 0);

        let percentageScore;
        if (quizScore) {
            percentageScore = (quizScore / quiz.questions?.length!) * 100;
        }

        return {
            title: quiz.title,
            score: quizScore,
            percentageScore,
        };
    },

    computeQuizResult(questions: IQuizQuestion[], learnerAns: []) {
        return questions.reduce((score: number, question: IQuizQuestion) => {
            const questAns: any = learnerAns.find((answer: Record<string, unknown>) => String(answer.question_id) == String(question._id));
            if (questAns && String(questAns.selected_ans) == String(question.answer)) {
                return ++score;
            }
            return score;
        }, 0);
    },

    async listLearnersResult(quizId: string, learnerIds: []) {
        const [quiz, learners] = await Promise.all([
            this.findOne({ _id: quizId }),
            userService.list({
                'user._id': { $in: learnerIds.map((learnerUserId: string) => new mongoose.Types.ObjectId(learnerUserId)) },
                'user.deleted': false
            }, 'learner')
        ]);
        if (!quiz) throw new handleError(404, 'Quiz not found');
        console.log({learners})
        console.log(quiz.answers);
        return learners.map((learner) => {
            const learnerAns: any = quiz.answers?.find((answer: IQuizAnswer) => String(answer.learner) == String(learner.id));
            if (!learnerAns) {
                return { ...learner, score: 'NIL' };
            }
            return { ...learner, score: this.computeQuizResult(quiz.questions!, learnerAns.answers) };
        });
    }
};