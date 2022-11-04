import Program, { IProgram, IAddSponsorPayload } from './model';
import { School } from '../user/models';
import { handleError } from '../helpers/handleError';
import mongoose from 'mongoose';

export const programService = {
    async create(program: IProgram): Promise<IProgram> {

        return Program.create({ ...program, start_date: new Date(program.start_date), end_date: new Date(program.end_date) });
    },


    // async addSchools(programId: string, schoolData: [IAddSchoolPayload]): Promise<Boolean> {
    //     const program = await this.view(programId);

    //     if (!program) {
    //         throw new handleError(400, 'Invalid program ID');
    //     }

    //     const schoolIds = schoolData.map(sd => sd.id);
    //     const schoolAlreadyOnProgram = program.schools?.find((schl: IAddSchoolPayload) => schoolIds.includes(String(schl.id)));
    //     if (schoolAlreadyOnProgram) {
    //         throw new handleError(400, 'School already added to Program');
    //     }

    //     const schools = [...program.schools || [], ...schoolData];
    //     program.schools = schools;
    //     await program.save();
    //     return true;
    // },


    async addSponsors(programId: string, sponsorData: [IAddSponsorPayload]): Promise<Boolean> {
        const program = await this.view(programId);

        if (!program) {
            throw new handleError(400, 'Invalid program ID');
        }

        const sponsorIds = sponsorData.map(sd => sd.id);
        const sponsorAlreadyOnProgram = program.sponsors?.find((spons: IAddSponsorPayload) => sponsorIds.includes(String(spons.id)));
        if (sponsorAlreadyOnProgram) {
            throw new handleError(400, 'Already added to Program');
        }

        const sponsors = [...program.sponsors || [], ...sponsorData];
        program.sponsors = sponsors;
        await program.save();
        return true;
    },


    async addCourses(programId: string, courseIds: [string]): Promise<Boolean> {
        const program = await this.view(programId);

        if (!program) {
            throw new handleError(400, 'Invalid program ID');
        }

        const courses = new Set([...program.courses, ...courseIds]);
        program.courses = Array.from(courses);
        await program.save();
        return true;
    },


    async view(criteria: object | string): Promise<IProgram | null> {
        if (typeof criteria == "object")
            return Program.findOne(criteria);
        else {
            return Program.findById(criteria);
        }
    },


    async list(criteria: object): Promise<IProgram[] | []> {
        return Program.find(criteria);
    },


    async listSchoolPrograms(): Promise<IProgram[] | []> {
        return this.list({});
    },


    async listLearnerPrograms(): Promise<IProgram[] | []> {
        return this.list({});
    },


    async listEnrolledSchools(programId: string): Promise<object> {
        // const schools = await Program.findOne(
        //     { _id: new mongoose.Types.ObjectId(programId), 'sponsors.sponsortype': 'school' }
        // ).select('-_id sponsors learners');
        return [];
    },


    async update(programId: string, data: object): Promise<void> {
        Program.updateOne({ _id: new mongoose.Types.ObjectId(programId) }, data);
    },

    async delete(programId: string): Promise<void> {
        Program.updateOne({ _id: new mongoose.Types.ObjectId(programId) }, { deleted: true });
    }
}