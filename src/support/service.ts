import { IAddSupportComment, IAddSupportQuestion } from './interface';
import { Comment, Question } from './model';

export const supportService = {

    async createQuestion(supportQuestion: IAddSupportQuestion) {
        const { question, user_id, class_id, program_id, course_id, lesson } = supportQuestion;
        const newQuestion = await Question.create({
            question: question,
            user: user_id,
            class: class_id,
            program: program_id,
            course: course_id,
            lesson: lesson
        });
        return newQuestion;
    },

    async list(criteria = {}, klass: boolean, program: boolean) {
        const populate = [{ path: 'course', select: 'id title difficulty_level course_quadrant' }];
        if (klass) populate.push({ path: 'class', select: 'id name school_id' });
        if (program) populate.push({ path: 'program', select: 'id name' });

        return Question.find(criteria).populate(populate).sort({ createdAt: -1 });
    },

    async fetchClassQuestions(classId: string) {
        return this.list({ class: classId }, true, false);
    },

    async fetchProgramQuestions(programId: string) {
        return this.list({ program: programId }, false, true);
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
            select: 'fullname role'
        });
        // @ts-expect-error: just ignore
        return data.map((comment: IAddSupportComment) => comment.toJSON());
    }
};