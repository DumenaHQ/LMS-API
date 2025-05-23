import User, { IUserView, IUserCreate, Parent, School, Learner, Instructor, EUserStatus, Admin, SchoolSetting } from './models';
import { sign } from 'jsonwebtoken';
import { handleError } from '../helpers/handleError';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Buffer } from 'buffer';
import mongoose, { ObjectId } from 'mongoose';
import { emailService } from '../helpers/email';
import { generateId, getValidModelFields } from '../helpers/utility';
import { paymentService } from '../payment/service';
import { SALT_ROUNDS, TERMS, USER_FIELDS, USER_TYPES } from '../config/constants';
import { xlsxHelper } from '../helpers/xlsxHelper';
import Class from '../class/model';
import { UserSubscription } from '../subscription/model';
import { subscriptionService } from '../subscription/service';
import { classService } from '../class/service';
import { miscService } from '../misc/miscService';

const userModel: Record<string, any> = {
    [USER_TYPES.learner]: Learner,
    [USER_TYPES.parent]: Parent,
    [USER_TYPES.school]: School,
    [USER_TYPES.user]: User,
    [USER_TYPES.instructor]: Instructor,
    [USER_TYPES.admin]: Admin
};


export const userService = {
    async authenticate(emailOrUsername: string, password: string): Promise<object> {
        const usernameOrEmail = emailOrUsername.toLowerCase();
        const foundUser = await User.findOne({ $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }] });

        if (!foundUser) throw new handleError(404, 'Email or password is incorrect');

        if (foundUser.deleted) throw new handleError(404, 'This user has been deleted');

        const match = await bcrypt.compare(password, foundUser.password);
        if (!match) throw new handleError(400, 'Email and password doesn\'t match');

        if (foundUser.status == EUserStatus.Inactive) throw new handleError(422, 'User account is inactive.');

        const payload: any = {
            id: foundUser._id,
            fullname: foundUser.fullname,
            email: foundUser.email,
            role: foundUser.role,
            isUserOnboarded: foundUser.isUserOnboarded
        };

        if (foundUser.phone) payload.phone = foundUser.phone;
        if (foundUser.active_organization) payload.organization = foundUser.active_organization;

        let user_type = {};
        let userType: Record<any, unknown> = {};
        if (foundUser.role != USER_TYPES.admin) {
            user_type = await userModel[foundUser.role].findOne({ user: foundUser._id }).select({ user: 0 });

            userType = user_type ? JSON.parse(JSON.stringify(user_type)) : {};
            userType[`${foundUser.role}_id`] = userType.id;
            if (!userType['school_email']) {
                payload['school_email'] = foundUser.email;
            }
            delete userType.id;
        }

        const token: string = sign({ id: foundUser._id }, process.env.JWT_SECRET as string, {
            expiresIn: '24h',
        });
        return {
            ...payload,
            ...userType,
            token
        };
    },


    async create(userData: IUserCreate, user: { school_id: string; role: string; } | null = null): Promise<IUserView | { status: string, message: string, data: {} }> {
        const { user_type, email = undefined } = userData;
        if (email != undefined) {
            userData.email = email.toLowerCase();
        }
        if (email === "") {
            delete userData.email;
        }

        if (user && user.role === USER_TYPES.school) userData.school_id = user.school_id;

        try {
            const isDuplicate = await this.isDuplicateUser(userData);
            if (isDuplicate === true) return userData as unknown as IUserView;

            const newUser = await this.createUserAndUserType(userData);

            const rolesWithoutVerificationEmail = [
                USER_TYPES.learner,
                USER_TYPES.admin,
                USER_TYPES.instructor
            ];
            if (!rolesWithoutVerificationEmail.includes(user_type)) {
                emailService.sendVerificationEmail(newUser);
            }
            if (user_type == USER_TYPES.instructor) {
                emailService.sendSetNewPasswordLink(newUser, String(user?.school_id));
            }
            return newUser;
        } catch (err: any) {
            return { status: 'error', message: err.message, data: userData };
        }
    },

    async createUserAndUserType(userData: IUserCreate) {
        const { fullname, parent, school, password, user_type } = userData;
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const data: Record<string, any> = getValidModelFields(userModel['user'], userData);
        data.password = passwordHash;
        data.role = user_type;

        // for learners added by parents/schools
        if (user_type == USER_TYPES.learner && (parent || school)) {
            data.username = await this.ensureUniqueUsername(fullname.toLowerCase().split(' ').join('.'));
            data.status = EUserStatus.Active;
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const newUser = await User.create([data], { session });
            const userTypeData = getValidModelFields(userModel[user_type], userData);
            userTypeData.user = newUser[0].id;
            // for admins being onboarded
            if (user_type == USER_TYPES.admin) {
                data.status = EUserStatus.Active;
                userTypeData.role = userData.admin_role;
            }
            await userModel[user_type].create([userTypeData], { session });
            await session.commitTransaction();
            return this.view({ _id: newUser[0].id });
        } catch (err) {
            await session.abortTransaction();
            throw new handleError(400, 'Error creating user');
        } finally {
            session.endSession();
        }
    },

    async onboardAdmin(userData: IUserCreate) {
        try {
            return this.createUserAndUserType(userData);
        } catch (err: any) {
            return { status: 'error', message: err.message, data: userData };
        }
    },

    async activateAccount(email_hash: string, hash_string: string): Promise<IUserView | null> {
        if (!email_hash || !hash_string) {
            throw new handleError(400, 'Email or hash not found');
        }
        const email = Buffer.from(email_hash, 'base64url').toString('ascii');
        const user = await User.findOne({ email }).select(USER_FIELDS);

        if (!user) throw new handleError(400, 'Account not found');

        if (!user.email || process.env.EMAIL_HASH_STRING) {
            throw new handleError(400, 'Cannot activate account now');
        }

        const hash = crypto.createHash('md5').update(user.email + process.env.EMAIL_HASH_STRING).digest('hex');
        if (hash_string !== hash) {
            throw new handleError(400, 'Invalid hash. couldn\'t verify your email');
        }
        user.status = EUserStatus.Active;

        if (user.role === USER_TYPES.school) {
            const [userType, subscription] = await Promise.all([
                userModel[user.role].findOne({ user: user.id }),
                subscriptionService.findOne({
                    slug: 'standard-plan'
                })
            ]);

            if (subscription) {
                await subscriptionService.migrateSchoolToSubscription(userType.id, subscription.id);
            }
        }

        await user.save();
        return this.view({ _id: user.id });
    },

    async verifyPasswordResetLink(email_hash: string, hash_string: string) {
        if (!email_hash || !hash_string) {
            throw new handleError(400, 'Email or hash not found');
        }
        const email = Buffer.from(email_hash, 'base64url').toString('ascii');
        const user = await this.findOne({ email });
        if (!user) throw new handleError(400, 'Invalid email hash. couldn\'t verify your email');

        const hash = crypto.createHash('md5').update(email + process.env.EMAIL_HASH_STRING).digest('hex');
        if (hash_string !== hash) {
            throw new handleError(400, 'Invalid hash. couldn\'t verify your email');
        }
        return { id: user.id, status: true };
    },

    async changePassword(newPassword: string, user_id: ObjectId) {
        if (!newPassword) throw new handleError(400, 'Password can not be empty');
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // updating status here is a quick hack, that's only for instructor user types
        return User.updateOne({ _id: user_id }, { password: passwordHash, status: EUserStatus.Active });
    },

    async findOne(criteria: object) {
        return User.findOne({ ...criteria, deleted: false });
    },

    async view(criteria: object) {
        const user = await User.findOne(criteria).select({ password: 0 });
        if (!user) throw new handleError(404, 'User not found');

        const user_type = await userModel[user.role].findOne({ user: user.id }).select({ user: 0 });

        const userType = user_type ? user_type.toJSON() : {};
        userType[`${user.role}_id`] = userType.id;
        delete userType.id;
        if (user.role == USER_TYPES.admin) {
            userType.admin_role = userType.role;
        }
        return { ...userType, ...user.toJSON() };
    },

    async list(match = {}, user_type: string): Promise<IUserView[] | []> {
        const users = await userModel[user_type].aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $match: match
            },
            {
                $set: {
                    id: '$user._id',
                }
            },
            {
                $project: {
                    __v: 0,
                    _id: 0,
                    'user._id': 0,
                    'user.__v': 0,
                    'user.role': 0,
                    'user.deleted': 0,
                    'user.password': 0,
                    // 'user.status': 0,
                }
            },
            {
                $sort: { 'createdAt': -1 }
            }
        ]);
        return users.map((user: object) => this.sanitizeUser(user));
    },

    async getAllUsers(match = {}) {
        const rawUsers = await User.find({ ...match }).select({ password: 0 });
        return rawUsers.map(user => user.toJSON());
    },

    async getAllUsersAndUserType(match = {}) {
        const users = await this.getAllUsers(match);

        return Promise.all(
            users.map(async (user: any) => {
                const user_type = await userModel[user.role].findOne({ user: user.id }).select({ user: 0 });
                if (!user_type) return user;
                if (user.role === USER_TYPES.admin) {
                    const { role: admin_role, ...userType } = user_type.toJSON();
                    return { ...user, ...userType, admin_role };
                }
                if (user.role === USER_TYPES.school) {
                    const subscription = await UserSubscription.findOne({
                        school: user_type._id,
                        status: 'active'
                    }).populate('subscription');
                    const modifiedUserType = { ...user_type.toJSON(), subscription };
                    return { ...user, ...modifiedUserType };
                }
                return { ...user, ...user_type.toJSON() };
            })
        );
    },


    async listSchoolStudents(schoolId: string, queryParams: object = {}) {
        const validParams = ['search', 'grade'];
        const validQueryParams: Record<string, any> = {};
        for (const [key, value] of Object.entries(queryParams)) {
            if (validParams.includes(key)) {
                validQueryParams[key] = value;
            }
        }
        const criteria = {
            school: new mongoose.Types.ObjectId(schoolId),
            'user.deleted': false,
            ...(validQueryParams.grade && { grade: validQueryParams.grade }), // Added this: Filters learners by grade if the grade parameter is provided.
            ...(validQueryParams.search && {
                $or: [ // Added this: Searches learners by fullname, username, or email using a case-insensitive regular expression.
                    { 'user.fullname': { $regex: validQueryParams.search, $options: 'i' } },
                    { 'user.username': { $regex: validQueryParams.search, $options: 'i' } },
                    { 'user.email': { $regex: validQueryParams.search, $options: 'i' } }
                ]
            }),
        };
        const learners = await this.list(criteria, 'learner');
        const grades: any = [];
        learners.forEach((learner: any) => {
            learner.grade && grades.push(learner.grade);
        });
        return { learners, grades: new Set(grades) };
    },

    async listSchoolTeachers(schoolId: string) {
        const criteria = {
            school_id: new mongoose.Types.ObjectId(schoolId),
            'user.deleted': false
        };

        return this.list(criteria, 'instructor');
    },

    async update(userId: string, userData: IUserCreate): Promise<IUserView | null> {
        const { user_type } = userData,
            criteria = { _id: new mongoose.Types.ObjectId(userId) };

        const userUpdateData = getValidModelFields(User, userData),
            userTypeData = getValidModelFields(userModel[user_type], userData);

        await Promise.all([
            User.updateOne(criteria, userUpdateData),
            userModel[user_type].updateOne({ user: new mongoose.Types.ObjectId(userId) }, userTypeData)
        ]);
        return this.view(criteria);
    },

    async changeUserStatus(userId: string, status: string) {
        return User.updateOne({ _id: new mongoose.Types.ObjectId(userId) }, { status });
    },

    async ensureUniqueUsername(username: string): Promise<string> {
        const foundUsername = await User.findOne({ username }).lean();

        if (foundUsername) {
            const newUsername = username + generateId('', 2, true);
            return this.ensureUniqueUsername(newUsername);
        }
        return username;
    },

    async getParentChildren(parentId: string) {
        const criteria = {
            parent: new mongoose.Types.ObjectId(parentId),
            'user.deleted': false
        };
        return this.list(criteria, 'learner');
    },


    async removeLearner(learnerId: string) {
        const learner = await Learner.findOne({ user: learnerId });
        if (!learner) throw new handleError(404, 'Learner not found');

        await User.updateOne({ _id: learnerId }, { deleted: true });
    },


    async addSchoolStudents(schoolId: string, studentsData: [], schoolName: string): Promise<{}> {
        const password = 'dumena';
        return Promise.all(studentsData.map(async (student: any) => {
            const learner = await this.create({ ...student, school: schoolId, password, user_type: 'learner' }, null);
            const { parent_email } = student;
            emailService.emailParentOnchildEnrollment({ ...learner, parent_email, password, schoolName });
        }));
    },


    async getUserPayments(userId: string) {
        return paymentService.list({ user: new mongoose.Types.ObjectId(userId) });
    },

    async isDuplicateUser({ fullname, school, parent_email, user_type }: IUserCreate) {
        if (user_type != USER_TYPES.learner) return false;

        const criteria = {
            school: new mongoose.Types.ObjectId(school),
            'user.fullname': fullname,
            parent_email
        };
        const user = await this.list(criteria, 'learner');
        return user.length > 0;
    },


    sanitizeUser(rawUser: any) {
        const user = { ...rawUser.user };
        delete rawUser.user;
        if (rawUser._id) {
            rawUser.id = rawUser._id;
            delete rawUser._id;
        }
        return {
            ...rawUser,
            ...user
        };
    },

    async downloadUserData(userType: string) {
        const users = await userModel[userType].find({}).populate({ path: 'user', select: 'fullname email phone createdAt' });

        const columns = [
            { label: 'Name', value: (row: any) => row.user.fullname },
            { label: 'Email', value: (row: any) => row.user.email },
            { label: 'Phone', value: 'phone' },
            { label: 'Location', value: 'resident_state' },
            { label: 'Signed up on', value: (row: any) => row.user.createdAt, format: 'd-mmm-yy' }
        ];
        // @ts-ignore
        return xlsxHelper.write(columns, users, 'parents_mailing_list');
    },

    async generateSchoolStudentsData(schoolId: string) {
        const students = await this.listSchoolStudents(schoolId);
        const columns = [
            { label: 'Fullname', value: (row: any) => row.fullname },
            { label: 'Username', value: (row: any) => row.username },
            { label: 'Grade', value: (row: any) => row.grade },
            { label: 'Gender', value: (row: any) => row.gender }
        ];
        // @ts-ignore
        return xlsxHelper.write(columns, students, 'students_list');
    },

    async deleteUser(email: string) {
        const user = await User.findOneAndDelete({ email });
        if (!user) return;
        await userModel[user.role].deleteOne({ user: user._id });
    },

    async schoolsAnalytics() {
        const schools = await School.find().sort({ createdAt: -1 }).limit(15);

        return Promise.all(schools.map(
            async (school) => {
                const totalInstructorsOnboarded = await Instructor.countDocuments({
                    school_id: school._id,
                });

                const totalLearnersOnboarded = await Learner.countDocuments({
                    school: school._id,
                });

                const totalClasses = await Class.countDocuments({
                    school_id: school._id,
                });

                return { ...school.toJSON(), totalInstructorsOnboarded, totalLearnersOnboarded, totalClasses };
            }
        ));

    },

    async getSchoolSettings(schoolId: string) {
        const settings = await SchoolSetting.findOne({ school: schoolId });

        const currentSession = await miscService.fetchCurrentSession();
        const active_term = miscService.findActiveTerm(currentSession);
        active_term.defaultDateChanged = false;

        // see if active term dates are set
        if (!settings || !settings.active_term) {
            return { school: schoolId, active_term };
        }

        if (settings.active_term.title !== active_term.title) {
            return { ...settings.toJSON(), active_term };
        }

        return settings;
    },

    async updateSchoolSettings(schoolId: string, settings: Record<string, any>) {
        const { active_term } = settings;
        const settingsFields: Record<string, any> = {};

        // validate fields
        if (active_term.start_date && active_term.end_date) {
            const currentSession = await miscService.fetchCurrentSession();
            const activeTerm = miscService.findActiveTerm(currentSession);

            if (activeTerm) {
                settingsFields.active_term = {
                    title: activeTerm.title,
                    defaultDateChanged: true,
                    start_date: new Date(String(active_term.start_date)),
                    end_date: new Date(String(active_term.end_date))
                };
                // update school classes
                await classService.updateDefaultTermsForClass(schoolId, settingsFields.active_term);
            }
        }
        return SchoolSetting.findOneAndUpdate(
            { school: schoolId },
            settingsFields,
            { upsert: true }
        );
    }
};