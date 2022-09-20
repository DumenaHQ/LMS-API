import Quiz from './models';
import { IQuiz, IQuizQuestion } from './interfaces';
import { handleError } from '../helpers/handleError';
import mongoose from 'mongoose';

export const quizService = {
    async create(quiz: IQuiz): Promise<IQuiz> {
        if (!quiz.title) throw new handleError(400, 'Quiz must have a title');

        return Quiz.create(quiz);
    },


    async view(criteria: object): Promise<IQuiz | null> {
        return Quiz.findOne(criteria);
    },


    async saveQuizQuestions(quizId: string, questions: IQuizQuestion[]) {
        const quiz = await this.view({ _id: new mongoose.Types.ObjectId(quizId) });
        if (!quiz) throw new handleError(404, 'Quiz not found');

        quiz.questions?.push(...questions);
        await quiz.save();
    }
}