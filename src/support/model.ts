import mongoose, { Schema } from 'mongoose';

// Support Question Schema
const questionSchema = new Schema( {
    question: String,
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    class: {
        type: Schema.Types.ObjectId,
        ref: 'Class'
    },
    program: {
        type: Schema.Types.ObjectId,
        ref: 'Program'
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    lesson: Object,
}, { timestamps: true } );
export const Question = mongoose.model('Question', questionSchema);

// Support Question Comment Schema
const commentSchema = new Schema( {
    comment: String,
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
