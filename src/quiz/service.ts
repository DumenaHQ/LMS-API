import Quiz, { QuizLevelType, quizAnswers } from './models';
import Course from '../course/model';
import { IQuiz, IQuizQuestion, IQuizAnswer } from './interfaces';
import { handleError } from '../helpers/handleError';
import mongoose from 'mongoose';
import { userService } from '../user/service';

export const quizService = {
    async create(quiz: IQuiz): Promise<IQuiz> {
        if (!quiz.title) throw new handleError(400, 'Quiz must have a title');

        return Quiz.create(quiz);
    },

    async attachQuiz(quizId: string, courseId: string, quiz_level: QuizLevelType, quiz_level_id: string): Promise<void> {
        const [quiz, course] = await Promise.all([
            Quiz.findById(quizId),
            Course.findById(courseId)
        ]);

        if (!quiz) throw new handleError(400, 'Quiz not found');
        if (!course) throw new handleError(400, 'Course not found');

        const quizUpdateData: any = { course_id: courseId };
        if (quiz_level) {
            quizUpdateData.quiz_level = quiz_level;
            quizUpdateData.quiz_level_id = quiz_level_id;
        }
        await Quiz.updateOne({ _id: new mongoose.Types.ObjectId(quizId) }, quizUpdateData);
    },


    async view(criteria: object): Promise<IQuiz> {
        const quiz = await this.findOne(criteria);
        if (!quiz) throw new handleError(404, 'Quiz not found');

        return quiz;
    },

    async list(criteria: object): Promise<IQuiz[]> {
        const quizes = await Quiz.find().select('-answers').sort({ createdAt: 'desc' });
        return quizes.map(rawQuiz => {
            const quiz = rawQuiz.toJSON();
            const questions = quiz.questions;
            delete quiz.questions;
            return { ...quiz, question_count: questions.length }
        });
    },

    async findOne(criteria: object): Promise<IQuiz | null> {
        return Quiz.findOne(criteria);
    },


    async saveQuizQuestions(quizId: string, questions: IQuizQuestion[]) {
        const quiz = await Quiz.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(quizId) },
            {
                $push: {
                    "questions": { $each: questions }
                }
            }
        );
        if (!quiz) throw new handleError(400, 'Quiz not found');
    },

    async saveAnswers(quizId: string, user: { userId: string, school_id: string }, selectedOpts: { question_id: string, selected_ans: string }[]) {
        const { school_id, userId: learner } = user;
        const quiz = await Quiz.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(quizId) },
            {
                $push: {
                    "answers": {
                        learner,
                        school_id,
                        answers: selectedOpts
                    }
                }
            }
        );
        if (!quiz) throw new handleError(400, 'Quiz not found');
    },

    async markQuiz(quizId: string) {

    },

    async computeLearnerResult(quizId: string, learnerId: string) {
        const quiz = await this.view({ _id: quizId });
        const learnerAnswers = quiz.answers?.find((answer: IQuizAnswer) => String(answer.learner) == learnerId);
        if (!learnerAnswers) throw new handleError(400, 'This Learner hasn\'t taken the quiz yet');

        const { answers }: any = learnerAnswers;
        const score = quiz.questions?.reduce((score: number, question: IQuizQuestion) => {
            const questAns = answers.find((answer: any) => answer.question_id == question.id);
            if (questAns && questAns.selected_ans == question.answer) {
                return ++score;
            }
            return score;
        }, 0);
    },

    async computeQuizResult(questions: IQuizQuestion[], learnerAns: []) {
        return questions.reduce((score: number, question: IQuizQuestion) => {
            const questAns: any = learnerAns.find((answer: any) => answer.question_id == question.id);
            if (questAns && questAns.selected_ans == question.answer) {
                return ++score;
            }
            return score;
        }, 0);
    },

    async listLearnersResult(quizId: string, learnerIds: []) {
        const [quiz, learners] = await Promise.all([
            this.findOne({ _id: quizId }),
            userService.list({
                'user._id': { $in: learnerIds },
                'user.deleted': false
            }, 'learner')
        ]);
        if (!quiz) throw new handleError(404, 'Quiz not found');

        learners.map((learner) => {
            const learnerAns: any = quiz.answers?.find((answer: IQuizAnswer) => String(answer.learner) == String(learner.id));
            if (!learnerAns) {
                return { ...learner, score: 'NIL' };
            }
            return { ...learner, score: this.computeQuizResult(quiz.questions!, learnerAns.answers) };
        });
    }
}