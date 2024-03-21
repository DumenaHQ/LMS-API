const mongoose = require('mongoose');
import { dbConfig, env } from './config';

const { host, port, user, password, name: dbname } = dbConfig;

(async function () {
    try {
        const credentials = {
            development: `mongodb://${host}:${port}/${dbname}`,
            production: `mongodb+srv://${user}:${password}@${host}/${dbname}?w=majority`
        };
        await mongoose.connect(`${credentials[env]}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
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