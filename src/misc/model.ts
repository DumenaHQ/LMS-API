import mongoose, { Schema } from 'mongoose';

const session = new Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    terms: {
        first_term: {
            title: 'first term',
            start_date: new Date(String(`${new Date().getFullYear()}-09-03T00:00:00.000Z`)),
            end_date: new Date(`${new Date().getFullYear()}-12-23T00:00:00.000Z`),
        },
        second_term: {
            title: 'second term',
            start_date: new Date(`${new Date().getFullYear() + 1}-01-03T00:00:00.000Z`),
            end_date: new Date(`${new Date().getFullYear() + 1}-04-07T00:00:00.000Z`),
        },
        third_term: {
            title: 'third term',
            start_date: new Date(`${new Date().getFullYear() + 1}-04-14T00:00:00.000Z`),
            end_date: new Date(`${new Date().getFullYear() + 1}-07-20T00:00:00.000Z`),
        }
    }
})

export default mongoose.model('Session', session);
