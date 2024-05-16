import { handleError } from '../helpers/handleError';
import { TEMPLATE_FILE_PATH } from '../config/constants';
import * as path from 'path';
import { Learner, School } from '../user/models';
import Class from '../class/model';


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
        return path.join(__dirname, '../../', `${TEMPLATE_FILE_PATH}/${templateFiles[name]}`);
    },

    async swapLearnerSchoolId() {
        const schools = await School.find();
        const res = await Promise.all(schools.map(async school => Learner.updateMany({ school: school.user }, { school: school._id })));
    },

    async swapClassSchoolId() {
        const schools = await School.find();
        const res = await Promise.all(schools.map(async school => Class.updateMany({ school_id: school.user }, { school_id: school._id })));
    },
};

