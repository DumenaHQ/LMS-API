import mongoose, { Schema, Document } from 'mongoose';

export enum EStatus {
    Active = 'active',
    Archived = 'archived'
}

export interface IAddLearner {
    user_id: Schema.Types.ObjectId,
    date_added?: Date
}

export interface ITerm {
    title: string,
    defaultDateChanged?: boolean,
    modules?: any[],
    courses?: string[],
    start_date: Date,
    end_date: Date
}

export interface IClass extends Document {
    name: string;
    terms: ITerm[];
    template?: Schema.Types.ObjectId | ITemplate;
    active_term?: ITerm;
    description: string;
    school_id: Schema.Types.ObjectId;
    parent_id: Schema.Types.ObjectId;
    teacher_id?: Schema.Types.ObjectId,
    thumbnail?: string;
    header_photo?: string;
    learners: IAddLearner[];
    courses?: string[];
    status: string;
    deleted: boolean;
}

export interface ITemplate extends Document {
    terms: [ITerm, ITerm, ITerm];
    title: string;
    syllabus: string;
    courses?: string[];
}

const learner = {
    user_id: Schema.Types.ObjectId,
    date_added: {
        type: Date,
        default: Date.now
    }
};



const classSchema = new Schema({
    terms: [],
    template: {
        type: Schema.Types.ObjectId,
        ref: 'ClassTemplate'
    },
    name: {
        type: String
    },
    description: String,
    school_id: Schema.Types.ObjectId,
    parent_id: Schema.Types.ObjectId,
    teacher_id: Schema.Types.ObjectId,
    thumbnail: String,
    header_photo: String,
    learners: [learner],
    courses: [],
    deleted: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: EStatus.Active,
        enum: EStatus
    }
}, { timestamps: true });

export default mongoose.model('Class', classSchema);

const classTemplate = new Schema({
    terms: [],
    title: {
        type: String,
        unique: true
    },
    syllabus: String,
    courses: [],
    status: {
        type: String,
        default: EStatus.Active,
        enum: EStatus
    },
    deleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const ClassTemplate = mongoose.model('ClassTemplate', classTemplate);