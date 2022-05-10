import HttpException from "../common/http-exception";
import { Request, Response, NextFunction } from "express";
const httpResponse = require("../helpers/httpResponse");

export const errorHandler = (
    error: HttpException,
    request: Request,
    response: Response,
    next: NextFunction
) => {
    const status = error.statusCode || 500;
    const message =
        error.message || "Opps!. Something went south.";

    httpResponse.send(response, status, message)
};