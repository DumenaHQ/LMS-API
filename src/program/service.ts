import Program, { IProgram, IAddSponsorPayload, IAddLearner, IProgramSponsor } from './model';
import { handleError } from '../helpers/handleError';
import mongoose, { ObjectId, Types } from 'mongoose';
import { ICourseView } from '../course/interfaces';
import { courseService } from '../course/service';

export const programService = {
    async create(program: IProgram): Promise<IProgram> {
        return Program.create({ ...program, start_date: new Date(program.start_date), end_date: new Date(program.end_date) });
    },

    async view(criteria: object | string): Promise<IProgram | null> {
        if (typeof criteria == "object")
            return Program.findOne(criteria);
        else {
            return Program.findById(criteria);
        }
    },


    async list(criteria: object): Promise<IProgram[] | []> {
        const courses = await Program.find(criteria);
        return courses.map((course: any) => ({ ...course.toJSON() }));
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
        const sponsorPrograms = programs.map((prog: IProgram) => {
            const hasJoined = prog.sponsors?.find((sponsor: IProgramSponsor) => String(sponsor.user_id) === String(sponsorId));
            delete prog.sponsors;
            return { ...prog, hasJoined: hasJoined ? true : false };
        });
        // @ts-ignore
        return sponsorPrograms;
    },


    async listProgramsForRoles(userId: ObjectId, userType: string): Promise<IProgram[] | undefined> {
        switch (userType) {
            case 'school' || 'parent':
                return this.listSponsorPrograms(userId);
            case 'admin':
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

        if (!sponsor) throw new handleError(400, 'User not eligible to enroll a canididate for this program');

        const addedLearnerIds = sponsor.learners.map((learner: IAddLearner) => String(learner.id));
        const learnersToAdd: IAddLearner[] = learners.filter((learner: IAddLearner) => !addedLearnerIds.includes(String(learner.id)));

        // @ts-ignore
        sponsor.learners.concat(learnersToAdd);
        program.sponsors?.push(sponsor);
        await program.save();

        //
        // TODO
        // -----
        // Detect and return learners already added to program
    },


    async update(programId: string, data: object): Promise<void> {
        Program.updateOne({ _id: new mongoose.Types.ObjectId(programId) }, data);
    },

    async delete(programId: string): Promise<void> {
        Program.updateOne({ _id: new mongoose.Types.ObjectId(programId) }, { deleted: true });
    }
}