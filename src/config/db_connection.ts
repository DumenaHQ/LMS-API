const mongoose = require('mongoose');
import { config } from "./config";
const env = process.env.NODE_ENV || 'development';

const { db: { host, port, name: dbname } } = config[env as keyof object];

(async function () {
    try {
        await mongoose.connect(`mongodb://${host}:${port}/${dbname}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`Connected to mongo ${env} server`);
    } catch (error) {
        console.log(error);
    }
})();