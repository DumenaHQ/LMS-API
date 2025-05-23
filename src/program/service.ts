import Program, { IProgram, IAddSponsorPayload, IAddLearner, IProgramSponsor } from './model';
import Course from '../course/model';
import User, { School } from '../user/models';
import { handleError } from '../helpers/handleError';
import mongoose, { ObjectId, Types } from 'mongoose';
import { ICourseView } from '../course/interfaces';
import { courseService } from '../course/service';
import { userService } from '../user/service';
import { IUserView } from '../user/models';
import { USER_TYPES, UPLOADS } from '../config/constants';
import { uploadFile } from '../helpers/fileUploader';
import { lmsBucketName } from '../config/config';
const { BUCKET_NAME: lmsBucket } = lmsBucketName;
import path from 'path';
import { orderService } from '../order/service';
import { subscriptionService } from '../subscription/service';

export const programService = {
    async saveProgram(program: IProgram, files: any): Promise<IProgram | null> {
        const { thumbnail, header_photo }: any = files || {};
        if (thumbnail) {
            const thumbKey = `${UPLOADS.program_thumbs}/${program.name.split(' ').join('-')}${path.extname(thumbnail.name)}`;
            program.thumbnail = await uploadFile(lmsBucket, thumbnail, thumbKey);
        }
        if (header_photo) {
            const photoKey = `${UPLOADS.program_header_photos}/${program.name.split(' ').join('-')}${path.extname(header_photo.name)}`;
            program.header_photo = await uploadFile(lmsBucket, header_photo, photoKey);
        }
        if (program.start_date) program.start_date = new Date(program.start_date);
        if (program.end_date) program.end_date = new Date(program.end_date);

        if (program.id) {
            const programId = program.id;
            delete program.id;
            await Program.updateOne({ _id: new mongoose.Types.ObjectId(programId) }, program);
            return null;
        }
        return Program.create(program) as unknown as IProgram;
    },

    async view(criteria: object | string, user: { roleId: string, role: string }): Promise<IProgram | null> {
        let program: any;
        if (typeof criteria == 'object')
            program = await Program.findOne({ ...criteria, deleted: false });
        else {
            program = await Program.findById(criteria);
        }
        if (!program) {
            throw new handleError(404, 'Program no found');
        }
        program = program.toJSON();

        // refactor please!
        if (user && user.role == USER_TYPES.parent || user?.role == USER_TYPES.school) {
            program.hasJoined = this.hasSponsorJoinedProgram(program, user?.roleId);
        }

        // fetch schools
        const schools = program?.sponsors?.filter((sp: IAddSponsorPayload) => sp.sponsor_type == 'school')!;
        program.schools = schools.map((sch: IProgramSponsor) => {
            const schoolLearners = program.learners.filter((learner: IAddLearner) => String(learner.sponsor_id) == String(sch.user_id));
            return { id: sch.user_id, name: sch.name, student_count: schoolLearners.length };
        });

        // fetch full learner details
        program.learners = await this.fetchLearnerDetails(program.learners || [], user);
        program.learner_count = program.learners && program.learners.length || 0;

        // fetch course details
        program.courses = await courseService.list({ _id: { $in: program.courses } });

        delete program.sponsors;
        return program;
    },


    async list(criteria: object): Promise<any[] | []> {
        const programs = await Program.find({ ...criteria, deleted: false }).sort({ createdAt: 'desc' });
        return programs.map((prog: Record<string, any>) => {
            const program = prog.toJSON();
            program.learner_count = prog.learners.length;
            program.school_count = prog?.sponsors?.filter((spon: Record<string, any>) => String(spon.sponsor_type) == String(USER_TYPES.school)).length;
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

        const addedSponsorIds = program.sponsors?.map((sd: Record<string, any>) => String(sd.user_id));
        const filteredSponors: any = validatedSponsors.filter((spons: Record<string, any>) => (addedSponsorIds?.includes(spons.user_id) === false));
        program.sponsors = [...program.sponsors || [], ...filteredSponors];
        await program.save();
    },


    async addCourses(programId: string, courseIds: [string]): Promise<void> {
        const program = await Program.findById(programId);

        if (!program) {
            throw new handleError(400, 'Invalid program ID');
        }

        const validatedCourses = await Promise.all(courseIds.map(async (courseId: string) => {
            const foundCourse = await Course.findById(courseId).select('_id');
            return foundCourse ? String(foundCourse._id) : null;
        }));
        const validatedCourseIds = validatedCourses.filter((course) => course);

        const courses = new Set([...program.courses, ...validatedCourseIds]);
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
                const schoolUser = await School.findOne({ user: userId });
                return this.listSponsorPrograms(schoolUser?.id);
            case USER_TYPES.parent:
                return this.listSponsorPrograms(userId);
            case USER_TYPES.learner:
                return this.listLearnerPrograms(String(userId));
            default:
                return this.list({ status: 'active' });
        }
    },


    async listLearnerPrograms(learnerId: string): Promise<IProgram[] | []> {
        return this.list({ 'learners.user_id': new mongoose.Types.ObjectId(learnerId) });
    },


    async listEnrolledSchools(programId: string): Promise<object | []> {
        const program = await Program.findById(programId);
        const schools = program?.sponsors?.filter((sp: Record<string, any>) => sp.sponsor_type == 'school')!;
        return schools.map((sch: Record<string, any>) => ({ school_id: sch.user_id, name: sch.name, student_count: sch.learners.length }));
    },


    async addLearners(programId: string, learners: [IAddLearner], sponsorId: string): Promise<void> {
        const program = await Program.findById(programId);
        if (!program) {
            throw new handleError(400, 'Invalid program ID');
        }

        const sponsor = program.sponsors?.find((spon: Record<string, any>) => {
            return String(spon.user_id) === String(sponsorId);
        });

        if (!sponsor) throw new handleError(400, 'User not eligible to enroll a candidate for this program');

        const addedLearnerIds = program.learners.map((learner: Record<string, any>) => String(learner.user_id));

        const validatedLearners = await Promise.all(learners.map(async (learner: IAddLearner) => {
            if (learner.user_id) {
                return User.findById(learner.user_id); //.populate({ path: 'user' });
                //return foundLearner.user;
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

    async fetchLearners(programId: string, user: { roleId: string, role: string }) {
        const program = await Program.findById(programId);
        if (!program) throw new handleError(400, 'Program not found');

        const learners: IAddLearner[] = program.learners.map((learner: any) => ({
            ...learner,
            user_id: learner.user_id ? String(learner.user_id) : undefined,
            sponsor_id: learner.sponsor_id ? String(learner.sponsor_id) : undefined,
        }));
        return this.fetchLearnerDetails(learners, user);
    },


    async fetchLearnerDetails(learners: IAddLearner[], user: { roleId: string, role: string }): Promise<IUserView[] | []> {
        let learnerIds;
        switch (user.role) {
            case USER_TYPES.learner:
                return [];
            case USER_TYPES.admin:
                learnerIds = learners.map(learner => learner.user_id);
                break;
            case USER_TYPES.school:
            case USER_TYPES.parent:
                const sponsorLearners = learners.filter(learner => String(learner.sponsor_id) == String(user.roleId));
                learnerIds = sponsorLearners?.map(learner => learner.user_id);
                break;
            default:
        }
        return userService.list({ 'user._id': { $in: learnerIds }, 'user.deleted': false }, 'learner');
    },

    hasSponsorJoinedProgram(program: IProgram, sponsorId: ObjectId | string): boolean {
        const hasJoined = program.sponsors?.find((sponsor: IProgramSponsor) => String(sponsor.user_id) === String(sponsorId));
        return hasJoined ? true : false;
    },

    async delete(programId: string): Promise<void> {
        await Program.updateOne({ _id: new mongoose.Types.ObjectId(programId) }, { deleted: true });
    },

    async subscribe(programId: string, userId: string, learners: []) {
        const sub = await subscriptionService.view({ slug: 'program' });
        const totalAmount = sub.amount * learners.length;
        const meta_data = { programId };
        const orderItems = learners.map((learner: any) => {
            const { user_id, name } = learner;
            return { order_type_id: sub._id, user_id, name, order_type: 'program', meta_data };
        });
        return orderService.createProgramOrder(userId, orderItems, totalAmount);
    },
};