import mongoose, { Schema, Document } from 'mongoose';

export interface IProgram extends Document {
    name: String;
    description: String;
    category: String;
    location: String;
    sponsors?: [];
    courses?: [];
    start_date?: Date;
    end_date?: Date;
    status: String;
}

export interface IAddSponsorPayload {
    id: string;
    name: string;
    type: string;
};


const sponsor = {
    sponsor_id: Schema.Types.ObjectId,
    sponsor_name: String,
    sponsor_type: String,
};

const student = {
    learner_id: Schema.Types.ObjectId,
    name: String,
    sponsor_id: Schema.Types.ObjectId,
    sponsor_name: String,
    sponsor_type: String,
    date_added: {
        type: Date,
        default: Date.now
    }
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
    learners: [],
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