import { handleError } from '../helpers/handleError';
import { TEMPLATE_FILE_PATH } from '../config/constants';
import * as path from 'path';
import User, { Learner, School } from '../user/models';
import Class from '../class/model';
import Session from './model';

export const miscService = {
    fetchTemplate(name: 'students_template') {
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
        await Promise.all(schools.map(async school => Learner.updateMany({ school: school.user }, { school: school._id })));
    },

    async swapClassSchoolId() {
        const schools = await School.find();
        await Promise.all(schools.map(async school => Class.updateMany({ school_id: school.user }, { school_id: school._id })));
    },

    async normaliseUsernames() {
        const users = await User.find({ status: 'active', deleted: false, role: 'learner' }).select('_id username');
        return Promise.all(users.map(
            async user => {
                return user.username && User.updateOne({ _id: user._id }, { username: user.username.toLowerCase() })
            }
        ))
    },

    async fetchCurrentSession() {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        let sessionTitle = '';
        if (currentMonth >= 8 && currentMonth <= 11) {
            sessionTitle = `${currentYear}/${currentYear + 1}`;
        } else {
            sessionTitle = `${currentYear - 1}/${currentYear}`;
        }
        const session = await Session.findOne({ title: sessionTitle });
        if (session) {
            return session;
        }
        const newSession = new Session({
            title: sessionTitle,
            terms: [
                {
                    title: 'first term',
                    start_date: new Date(String(`${new Date().getFullYear() - 1}-09-03T00:00:00.000Z`)),
                    end_date: new Date(`${new Date().getFullYear() - 1}-12-23T00:00:00.000Z`)
                },
                {
                    title: 'second term',
                    start_date: new Date(`${new Date().getFullYear()}-01-03T00:00:00.000Z`),
                    end_date: new Date(`${new Date().getFullYear()}-04-07T00:00:00.000Z`)
                },
                {
                    title: 'third term',
                    start_date: new Date(`${new Date().getFullYear()}-04-14T00:00:00.000Z`),
                    end_date: new Date(`${new Date().getFullYear()}-07-20T00:00:00.000Z`)
                }
            ]
        });
        return newSession.save();
    },

    findActiveTerm(session: any) {
        const currentDate = new Date();
        for (let i = 0; i < session.terms.length; i++) {
            if (currentDate >= session.terms[i].start_date && currentDate <= session.terms[i].end_date) {
                return session.terms[i];
            }
        }
        return null;
    }

}


