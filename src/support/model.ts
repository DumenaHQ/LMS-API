import mongoose, { Schema } from 'mongoose';

// Support Question Schema
const questionSchema = new Schema( {
    text: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    class: {
        type: Schema.Types.ObjectId,
        ref: 'Class'
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course'
    },
    lesson: Schema.Types.ObjectId,
}, { timestamps: true } );
export const Question = mongoose.model('Question', questionSchema);

// Support Question Comment Schema
const commentSchema = new Schema( {
    text: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    question: {
        type: Schema.Types.ObjectId,
        ref: 'Question'
    },
}, { timestamps: true } );
export const Comment = mongoose.model('Comment', commentSchema);
