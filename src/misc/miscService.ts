import { handleError } from '../helpers/handleError';
import { TEMPLATE_FILE_PATH } from '../config/constants';


export const miscService = {
    fetchTemplate(name: string) {
        if (!name) {
            throw new handleError(400, 'Template sample name not specified');
        }
        const templateFiles = {
            students_template: 'student_upload_template.xlsx'
        };
        if (!templateFiles[name]) {
            throw new handleError(400, 'Invalid template sample name');
        }
        return `${__dirname}/${TEMPLATE_FILE_PATH}/${templateFiles[name]}`;
    }
}