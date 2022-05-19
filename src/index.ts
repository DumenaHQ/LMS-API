import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
dotenv.config();
import { notFoundHandler } from "./middleware/notFound";
import { errorHandler } from "./middleware/error";
require('./config/db_connection');
import { router as routes } from './routes/';


if (!process.env.PORT) {
    console.log('Port not set');
    process.exit(1);
}

const PORT: number = parseInt(process.env.PORT as string, 10);

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/', routes);


// catch 404 and forward to error handler
app.use(notFoundHandler);

// error handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

module.exports = app;