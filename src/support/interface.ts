export interface IAddSupportQuestion {
question: string;
user_id: string;
class_id: string;
course_id: string;
lesson_id: string;
}

export interface IAddSupportComment {
comment: string;
user_id: string;
question_id: string;
}