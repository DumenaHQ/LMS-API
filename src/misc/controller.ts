import { Request, Response, NextFunction } from "express";
import { miscService } from "./miscService";

export const downloadTemplateFile = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name = '' } = req.query;
        const templateFile = miscService.fetchTemplate(name);
        const filename = templateFile.split('/')[2];
        res.writeHead(200, {
            "Content-Type": "application/octet-stream",
            "Content-disposition": `attachment; filename=${filename}`,
        })
        res.end(templateFile);
    } catch (err) {
        next(err);
    }
}