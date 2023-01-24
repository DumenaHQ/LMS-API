import Program, { IProgram, IAddSponsorPayload, IAddLearner, IProgramSponsor } from './model';
import User from '../user/models';
import { handleError } from '../helpers/handleError';
import mongoose, { ObjectId, Types } from 'mongoose';
import { ICourseView } from '../course/interfaces';
import { courseService } from '../course/service';
import { USER_TYPES } from '../config/constants';

export const programService = {
    async create(program: IProgram): Promise<IProgram> {
        return Program.create({ ...program, start_date: new Date(program.start_date), end_date: new Date(program.end_date) });
    },

    async view(criteria: object | string, sponsorId = ''): Promise<IProgram | null> {
        let program;
        if (typeof criteria == "object")
            program = await Program.findOne(criteria);
        else {
            program = await Program.findById(criteria);
        }
        const hasJoined = this.hasSponsorJoinedProgram(program, sponsorId);
        if (program && sponsorId) {
            program = program.toJSON();
            program.hasJoined = hasJoined;
        }
        return program;
    },


    async list(criteria: object): Promise<IProgram[] | []> {
        return Program.find(criteria).lean();
    },


    async addSponsors(programId: string, sponsorData: [IAddSponsorPayload]): Promise<void> {
        const program = await this.view(programId);

        if (!program) {
            throw new handleError(400, 'Invalid program ID');
        }

        const addedSponsorIds = program.sponsors?.map(sd => String(sd.user_id));
        const filteredSponors: any = sponsorData.filter((spons: IAddSponsorPayload) => (addedSponsorIds?.includes(spons.user_id) === false));
        program.sponsors = [...program.sponsors || [], ...filteredSponors];
        await program.save();
    },


    async addCourses(programId: string, courseIds: [string]): Promise<void> {
        const program = await this.view(programId);

        if (!program) {
            throw new handleError(400, 'Invalid program ID');
        }

        const courses = new Set([...program.courses, ...courseIds]);
        program.courses = Array.from(courses);
        await program.save();
    },

    async listCourses(programId: string): Promise<ICourseView[] | []> {
        const program = await this.view(programId);
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
        const program = await this.view(programId);
        const schools = program?.sponsors?.filter(sp => sp.sponsor_type == 'school')!;
        return schools.map(sch => ({ school_id: sch.user_id, name: sch.name, student_count: sch.learners.length }));
    },


    async addLearners(programId: string, learners: [IAddLearner], sponsorId: Types.ObjectId): Promise<void> {
        const program = await this.view(programId);
        if (!program) {
            throw new handleError(400, 'Invalid program ID');
        }

        const sponsor = program.sponsors?.find((spon: IProgramSponsor, index) => {
            if (String(spon.user_id) === String(sponsorId)) {
                return program.sponsors?.splice(index, 1)[0];
            }
        });

        if (!sponsor) throw new handleError(400, 'User not eligible to enroll a candidate for this program');

        const addedLearnerIds = program.learners.map((learner: IAddLearner) => String(learner.user_id));

        const validatedLearners = await Promise.all(learners.map(async (learner: IAddLearner) => {
            return User.findById(learner.user_id);
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

    async listAllProgramLearners(programId: string) {
        const program = await this.view(programId);
        return program?.sponsors?.reduce((learners, sponsor) => {
            return learners.concat(sponsor?.learners);
        }, []);
    },

    async listSponsorLearners(programId: string, sponsorId: ObjectId) {
        const program = await this.view(programId);
        const sponsorData = program?.sponsors?.find(sponsor => String(sponsor.user_id) == String(sponsorId));
        return sponsorData?.learners;
    },

    async listProgramLearners(programId: string, userType: string, userId: ObjectId): Promise<any[] | null> {
        let learners;
        switch (userType) {
            case USER_TYPES.admin:
                learners = await this.listAllProgramLearners(programId);
                break;
            case USER_TYPES.school || USER_TYPES.parent:
                learners = await this.listSponsorLearners(programId, userId);
                break;
            default:
        }
        return learners;
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