import { IAddSupportQuestion } from './interface';
import { Question } from './model';

export const supportService = {
    // Service to create a question POST
    async createQuestion(question: IAddSupportQuestion){
        const newQuestion = await Question.create({
            question: question.question,
            user: question.user_id,
            class: question.class_id,
            course: question.course_id,
            lesson: question.lesson
        }, { new: true });
        return newQuestion;
    }
};