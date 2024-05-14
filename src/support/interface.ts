import { IUserModel } from '../user/models';
import Class from '../class/model';
import Course from '../course/model';
export interface IAddSupportQuestion{
question: string;
user_id: string;
class_id: string;
course_id: string;
lesson: any;
}

export interface IQuestion{
    question: string;
    user: IUserModel;
    class: typeof Class;
    course: typeof Course;
    lesson: any;
}
export interface IAddSupportComment {
comment: string;
user_id: string;
question_id: string;
}