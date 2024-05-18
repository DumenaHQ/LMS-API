import { IAddSupportComment, IAddSupportQuestion } from './interface';
import { Comment, Question } from './model';

export const supportService = {

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


    async getQuestions(class_id?: string, school_id?: string) {
        const questions = await Question.find()
            .sort({ createdAt: -1 }) 
            .populate({ 
                path: 'user', 
                select: 'id email fullname role' // Exclude the fields from the response
            })
            .populate({path: 'class', select: 'id name school_id'})
            .populate({path:'course', select: 'id title difficulty_level course_quadrant'})
            .lean();


        
        // return questions from a given school
        if (school_id){
            return questions.map((question) => {
                if (question.class && String(question.class.school_id) === school_id){
                    return question;
                }
            }
            ).filter((question) => question !== null && question !== undefined);
        }
        if (!class_id) return questions;

        // return questions from a given class id
        return questions.map(
            (question) => {
                if (question.class && String(question.class._id) === class_id) return question;
            }
        ).filter((question) => question !== null && question !== undefined);
    },

 
    async createComment(comment: IAddSupportComment) {
        const newComment = await Comment.create({
            comment: comment.comment,
            user: comment.user_id,
            question: comment.question_id
        });
        return newComment;
    },


   
    async getComments(question_id: string) {
        const data = await Comment.find({ question: question_id }).populate({ 
            path: 'user', 
            select: '-password -isUserOnboarded -status' // Exclude the fields from the response
        });
        return data.map((comment) => comment.toJSON());
    },

};