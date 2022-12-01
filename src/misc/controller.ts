import { Request, Response, NextFunction } from "express";
import { miscService } from "./miscService";

export const downloadTemplateFile = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name = '' } = req.query;
        const templateFile = miscService.fetchTemplate(name);

        res.download(templateFile);
    } catch (err) {
        next(err);
    }
}