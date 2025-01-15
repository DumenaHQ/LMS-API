import mongoose, { Schema } from 'mongoose';

const session = new Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    terms: []
})

export default mongoose.model('Session', session);
