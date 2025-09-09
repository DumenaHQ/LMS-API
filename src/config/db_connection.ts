import mongoose from 'mongoose';
import { dbConfig, env } from './config';

const { host, user, password, name: dbname, connectionString } = dbConfig;

(async function () {
    try {
        const credentials = {
            development: connectionString,
            production: `mongodb+srv://${user}:${password}@${host}/${dbname}?w=majority`
        };
        await mongoose.connect(credentials[env as keyof typeof credentials]);
        console.log(`Connected to mongo ${env} server`);

        // remove _id and __v from all models
        mongoose.set('toJSON', {
            transform: (doc: any, ret: any) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                delete ret.deleted;
            }
        });
    } catch (error) {
        console.log(error);
    }
})();