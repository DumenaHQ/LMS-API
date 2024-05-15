import { IAddSupportComment, IAddSupportQuestion } from './interface';
import { Comment, Question } from './model';

export const supportService = {
    // Service to create a question POST
    async createQuestion(question: IAddSupportQuestion){
        const newQuestion = await Question.create({
            question: question.question,
            user: question.user_id,
            class: question.class_id,
            course: question.course_id,
            lesson: question.lesson
        });
        return newQuestion;
    },

    // Service to get questions GET
    async getQuestions(class_id?: string, school_id?: string) {
        const data = await Question.find().populate({ 
            path: 'user', 
            select: '-password -isUserOnboarded -status' // Exclude the fields from the response
        }).populate('class').populate('course');

        const questions = data.map((question) => question.toJSON());
        
        if (school_id){
            return questions.map((question) => {
      
                if (question.class && String(question.class.school_id) === school_id){
                    return question;
                }
            }
            );
        }
        if (!class_id) return questions;
        return questions.map(
            (question) => {
                if (question.class && String(question.class.id) === class_id) return question;
            }
        );
    },

    // Service to create a comment
    async createComment(comment: IAddSupportComment) {
        const newComment = await Comment.create({
            comment: comment.comment,
            user: comment.user_id,
            question: comment.question_id
        });
        return newComment;
    },
};