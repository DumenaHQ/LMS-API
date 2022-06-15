const mongoose = require('mongoose');
import { dbConfig, env } from "./config";

const { host, port, name: dbname } = dbConfig;

(async function () {
    try {
        await mongoose.connect(`mongodb://${host}:${port}/${dbname}`, {
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