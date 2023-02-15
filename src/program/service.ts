import Program, { IProgram, IAddSponsorPayload, IAddLearner, IProgramSponsor } from './model';
import User, { Learner, School } from '../user/models';
import { handleError } from '../helpers/handleError';
import mongoose, { ObjectId, Types } from 'mongoose';
import { ICourseView } from '../course/interfaces';
import { courseService } from '../course/service';
import { userService } from '../user/service';
import { IUserView } from '../user/models';
import { USER_TYPES } from '../config/constants';

export const programService = {
    async create(program: IProgram): Promise<IProgram> {
        return Program.create({ ...program, start_date: new Date(program.start_date), end_date: new Date(program.end_date) });
    },

    async view(criteria: object | string, user: { id: string, role: string } | null): Promise<IProgram | null> {
        let program: any;
        if (typeof criteria == "object")
            program = await Program.findOne(criteria);
        else {
            program = await Program.findById(criteria);
        }
        program = program.toJSON();

        // refactor please!
        if (program && user && (user.role == USER_TYPES.parent || user?.role == USER_TYPES.school)) {
            program.hasJoined = this.hasSponsorJoinedProgram(program, user?.id);
        }

        // fetch schools
        const schools = program?.sponsors?.filter((sp: IAddSponsorPayload) => sp.sponsor_type == 'school')!;
        program.schools = schools.map((sch: IProgramSponsor) => {
            const schoolLearners = program.learners.filter((learner: IAddLearner) => String(learner.sponsor_id) == String(sch.user_id));
            return { id: sch.user_id, name: sch.name, student_count: schoolLearners.length }
        });

        // fetch full learner details
        program.learner_count = program.learners && program.learners.length;
        program.learners = await this.fetchLearnerDetails(program.learners || [], user);

        // fetch course details
        program.courses = await courseService.list({ _id: { $in: program.courses } });

        delete program.sponsors;
        return program;
    },


    async list(criteria: object): Promise<any[] | []> {
        const programs = await Program.find(criteria);
        return programs.map((prog: IProgram) => {
            const program = prog.toJSON();
            program.learner_count = prog.learners.length;
            program.school_count = prog?.sponsors?.filter((spon: IAddSponsorPayload) => String(spon.sponsor_type) == String(USER_TYPES.school)).length;
            program.course_count = prog?.courses?.length;
            delete program.learners;
            delete program.schools;
            // delete program.sponsors;
            delete program.courses;
            return program;
        });
    },


    async addSponsors(programId: string, sponsorData: [IAddSponsorPayload]): Promise<void> {
        const program = await Program.findById(programId);

        if (!program) {
            throw new handleError(400, 'Invalid program ID');
        }

        const validatedSponsors = await Promise.all(sponsorData.map(async (sponsor: IAddSponsorPayload) => {
            const { sponsor_type, user_id } = sponsor;
            const invalidSponsor = { user_id: null, name: '', sponsor_type: '' };
            if (sponsor_type === 'school') {
                const foundSchool = await School.findOne({ user: user_id });
                return foundSchool ? { user_id: foundSchool._id, name: foundSchool.school, sponsor_type } : invalidSponsor;
            } else {
                const foundParent = await User.findOne({ _id: user_id });
                return foundParent ? { user_id: foundParent._id, name: foundParent.fullname, sponsor_type } : invalidSponsor;
            }
        }));

        const addedSponsorIds = program.sponsors?.map((sd: IAddSponsorPayload) => String(sd.user_id));
        const filteredSponors: any = validatedSponsors.filter((spons: IAddSponsorPayload) => (addedSponsorIds?.includes(spons.user_id) === false));
        program.sponsors = [...program.sponsors || [], ...filteredSponors];
        await program.save();
    },


    async addCourses(programId: string, courseIds: [string]): Promise<void> {
        const program = await Program.findById(programId);

        if (!program) {
            throw new handleError(400, 'Invalid program ID');
        }

        const courses = new Set([...program.courses, ...courseIds]);
        program.courses = Array.from(courses);
        await program.save();
    },

    async listCourses(programId: string): Promise<ICourseView[] | []> {
        const program = await Program.findById(programId);
        if (!program) throw new handleError(400, 'Program not found');

        return courseService.list({ _id: { $in: program.courses } });
    },


    async listSponsorPrograms(sponsorId: ObjectId): Promise<IProgram[] | []> {
        const programs = await this.list({ status: 'active' });
        if (!programs || !programs.length) {
            return [];
        }
        const sponsorPrograms = programs.map((prog: IProgram) => {
            const hasJoined = this.hasSponsorJoinedProgram(prog, sponsorId);
            delete prog.sponsors;
            return { ...prog, hasJoined };
        });
        // @ts-ignore
        return sponsorPrograms;
    },


    async listProgramsForRoles(userId: ObjectId, userType: string): Promise<IProgram[] | undefined> {
        switch (userType) {
            case USER_TYPES.school:
            case USER_TYPES.parent:
                return this.listSponsorPrograms(userId);
            default:
                return this.list({ status: 'active' });
        }
    },


    async listLearnerPrograms(): Promise<IProgram[] | []> {
        return this.list({});
    },


    async listEnrolledSchools(programId: string): Promise<object | []> {
        const program = await Program.findById(programId);
        const schools = program?.sponsors?.filter(sp => sp.sponsor_type == 'school')!;
        return schools.map(sch => ({ school_id: sch.user_id, name: sch.name, student_count: sch.learners.length }));
    },


    async addLearners(programId: string, learners: [IAddLearner], sponsorId: Types.ObjectId): Promise<void> {
        const program = await Program.findById(programId);
        if (!program) {
            throw new handleError(400, 'Invalid program ID');
        }

        const sponsor = program.sponsors?.find((spon: IProgramSponsor) => {
            return String(spon.user_id) === String(sponsorId);
        });

        if (!sponsor) throw new handleError(400, 'User not eligible to enroll a candidate for this program');

        const addedLearnerIds = program.learners.map((learner: IAddLearner) => String(learner.user_id));

        const validatedLearners = await Promise.all(learners.map(async (learner: IAddLearner) => {
            if (learner.user_id) {
                const foundLearner = await Learner.findById(learner.user_id).populate({ path: 'user' });
                return foundLearner.user;
            }
            return User.findOne({ username: learner.username });
        }));

        const learnersToAdd = validatedLearners.filter((learner: any) => {
            return learner && !addedLearnerIds.includes(String(learner._id));
        }).map(learner => ({ user_id: learner?._id, sponsor_id: sponsorId }));

        // @ts-ignore
        program.learners = [...program.learners, ...learnersToAdd];
        await program.save();

        //
        // TODO
        // -----
        // Detect and return learners already added to program
    },


    async fetchLearnerDetails(learners: IAddLearner[], user: { id: string, role: string }): Promise<IUserView[] | []> {
        let learnerIds;
        switch (user.role) {
            case USER_TYPES.admin:
                learnerIds = learners.map(learner => learner.user_id);
                break;
            case USER_TYPES.school:
            case USER_TYPES.parent:
                const sponsorLearners = learners.filter(learner => String(learner.sponsor_id) == String(user.id));
                learnerIds = sponsorLearners?.map(learner => learner.user_id);
                break;
            default:
        }
        return userService.list({ 'user._id': { $in: learnerIds } }, 'learner');
    },

    hasSponsorJoinedProgram(program: IProgram, sponsorId: ObjectId | string): boolean {
        const hasJoined = program.sponsors?.find((sponsor: IProgramSponsor) => String(sponsor.user_id) === String(sponsorId));
        return hasJoined ? true : false;
    },

    async update(programId: string, data: object): Promise<void> {
        Program.updateOne({ _id: new mongoose.Types.ObjectId(programId) }, data);
    },

    async delete(programId: string): Promise<void> {
        Program.updateOne({ _id: new mongoose.Types.ObjectId(programId) }, { deleted: true });
    }
}