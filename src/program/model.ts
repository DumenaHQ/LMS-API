import mongoose, { Schema, Document } from 'mongoose';

export interface IProgram extends Document {
    name: String;
    description: String;
    schools?: [];
    courses?: [];
    start_date?: Date;
    end_date?: Date;
    status: String;
}

export interface IAddSchoolPayload {
    id: string;
    name: string;
};

const school = {
    id: Schema.Types.ObjectId,
    name: String
};

const programSchema = new Schema({
    name: {
        type: String,
        unique: true
    },
    description: String,
    schools: {
        type: [school],
        default: []
    },
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