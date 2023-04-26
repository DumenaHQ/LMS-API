import mongoose, { Schema, Document, Types } from 'mongoose';


export interface IAddLearner {
    user_id?: string,
    username?: string
}


export interface IClass extends Document {
    name: String;
    description: String;
    school_id: Schema.Types.ObjectId;
    thumbnail?: String;
    header_photo?: String;
    learners: IAddLearner[];
    courses?: String[];
    status: String;
}

const learner = {
    user_id: Schema.Types.ObjectId,
    date_added: {
        type: Date,
        default: Date.now
    }
};


const classSchema = new Schema({
    name: {
        type: String,
        unique: true
    },
    description: String,
    school_id: Schema.Types.ObjectId,
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
        default: 'active'
    }
}, { timestamps: true });

export default mongoose.model('Class', classSchema);