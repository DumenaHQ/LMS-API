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
    },


    // Service to get questions GET
    async getQuestions(class_id?: string) {
        if (class_id){
            return Question.find({ class: class_id }).populate(['user', 'class', 'course']);
        } else {
            return Question.find().populate(['user', 'class', 'course']);
        }
    }



};