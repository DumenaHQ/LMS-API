import { Request, Response, NextFunction } from "express";
const httpResponse = require("../helpers/httpResponse");

export const notFoundHandler = (
    request: Request,
    response: Response,
    next: NextFunction
) => {

    const message = "Resource not found";

    httpResponse.send(response, 404, message)
};