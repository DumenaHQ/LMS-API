import mongoose, { Schema, Document, Types } from 'mongoose';


export interface IAddLearner {
    user_id?: string,
    username?: string,
    sponsor_id: string
}

export interface IProgramSponsor {
    user_id: Types.ObjectId;
    name: String;
    sponsor_type: String;
}

export interface IProgram extends Document {
    id?: Types.ObjectId;
    name: String;
    description: String;
    category: String;
    location: String;
    thumbnail?: String;
    header_photo?: String;
    sponsors?: Types.DocumentArray<IProgramSponsor>;
    learners: IAddLearner[];
    courses?: String[];
    hasJoined?: Boolean;
    start_date?: Date;
    end_date?: Date;
    status: String;
}

export interface IAddSponsorPayload {
    user_id: string;
    name: string;
    sponsor_type: string;
};


const learner = {
    user_id: Schema.Types.ObjectId,
    sponsor_id: Schema.Types.ObjectId,
    date_added: {
        type: Date,
        default: Date.now
    }
};

const sponsor = {
    user_id: Schema.Types.ObjectId,
    name: String,
    sponsor_type: String,
};


const programSchema = new Schema({
    name: {
        type: String,
        unique: true
    },
    description: String,
    category: {
        type: String,
        default: 'private'
    },
    location: {
        type: String,
        default: 'all'
    },
    thumbnail: String,
    header_photo: String,
    sponsors: [sponsor],
    learners: [learner],
    courses: [],
    start_date: Date,
    end_date: Date,
    deleted: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: 'active'
    }
}, { timestamps: true });

export default mongoose.model('Program', programSchema);