import mongoose, { Schema, Document, Types } from 'mongoose';


export interface IAddLearner {
    id: Types.ObjectId,
    name: string
}

export interface IProgramSponsor {
    id: Types.ObjectId;
    name: String;
    sponsor_type: String;
    learners: Types.DocumentArray<IAddLearner>
}

export interface IProgram extends Document {
    name: String;
    description: String;
    category: String;
    location: String;
    sponsors: Types.DocumentArray<IProgramSponsor>;
    courses: [string];
    hasJoined?: Boolean;
    start_date?: Date;
    end_date?: Date;
    status: String;
}

export interface IAddSponsorPayload {
    id: string;
    name: string;
    sponsor_type: string;
};


const learner = {
    id: Schema.Types.ObjectId,
    name: String,
    date_added: {
        type: Date,
        default: Date.now
    }
};

const sponsor = {
    id: Schema.Types.ObjectId,
    name: String,
    sponsor_type: String,
    learners: [learner]
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
    sponsors: [sponsor],
    courses: {
        type: [],
        default: []
    },
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