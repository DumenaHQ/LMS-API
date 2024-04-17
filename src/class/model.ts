import mongoose, { Schema, Document } from 'mongoose';

export enum EStatus {
    Active = 'active',
    Archived = 'archived'
}

export interface IAddLearner {
    user_id?: string,
    date_added?: Date
}


export interface IClass extends Document {
    name: string;
    template?: Schema.Types.ObjectId;
    description: string;
    school_id: Schema.Types.ObjectId;
    parent_id: Schema.Types.ObjectId;
    teacher_id?: Schema.Types.ObjectId,
    thumbnail?: string;
    header_photo?: string;
    learners: IAddLearner[];
    courses?: string[];
    status: string;
}

export interface ITemplate extends Document {
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

const termSchema = new Schema ({
    title: {
        type: String,
        default: 'on break'
    },
    start_date: {
        type:Date,
        default: Date.now
    },
    end_date: {
        type: Date,
        default:  function() {
            const currentDate = new Date();
            currentDate.setMonth(currentDate.getMonth() + 3);
            return currentDate;
        }
    },
}, { timestamps: true });

export const Term = mongoose.model('Term', termSchema);

const classSchema = new Schema({
    terms: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Term',
        }],
    },
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

classSchema.pre('save', async function (next) {
    try {
        const Term = mongoose.model('Term');
        const terms = ['First Term', 'Second Term', 'Third Term'];
  
        // Create three terms and associate them with the class
        const createdTerms = await Promise.all(terms.map(async (termTitle) => {
            const term = new Term({ title: termTitle });
            await term.save();
            // return term._id;
            return term;
        }));
  
        // Set the created terms in the class schema
        this.terms = createdTerms;
  
        next();
    } catch (error: any) {
        next(error);
    }
});
  
export default mongoose.model('Class', classSchema);

const classTemplate = new Schema({
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