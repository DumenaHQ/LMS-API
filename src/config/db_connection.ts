const mongoose = require('mongoose');
import { dbConfig, env } from "./config";

const { host, port, user, password, name: dbname } = dbConfig;

(async function () {
    try {
        const credentials = {
            development: `mongodb://${host}:${port}/${dbname}`,
            production: `mongodb://${user}:${password}@${host}/${dbname}?w=majority`
        };
        await mongoose.connect(`${credentials[env]}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`Connected to mongo ${env} server`);

        // remove _id and __v from all models
        mongoose.set('toJSON', {
            virtuals: true,
            transform: (doc: any, converted: { _id: any, __v: any }) => {
                delete converted._id;
                delete converted.__v;
            }
        });
    } catch (error) {
        console.log(error);
    }
})();