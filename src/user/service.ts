import User, { IUserView, IUserCreate, Parent, School, Learner } from './models';
import { sign } from "jsonwebtoken";
import { handleError } from "../helpers/handleError";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { Buffer } from 'buffer';
import mongoose, { ObjectId } from 'mongoose';
import { emailService } from '../helpers/email';
import { generateId, getValidModelFields } from '../helpers/utility';
import { paymentService } from '../payment/service';

import { SALT_ROUNDS, USER_FIELDS, LEARNER_FIELDS, USER_TYPES } from '../config/constants';
import { xlsxHelper } from '../helpers/xlsxHelper';

const userModel = {
    [USER_TYPES.learner]: Learner,
    [USER_TYPES.parent]: Parent,
    [USER_TYPES.school]: School,
};


export const userService = {
    async authenticate(emailOrUsername: string, password: string): Promise<object> {
        const foundUser = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] });
        if (!foundUser) throw new handleError(404, 'Email or password is incorrect');

        if (foundUser.deleted) throw new handleError(404, 'This user has been deleted');

        const match = await bcrypt.compare(password, foundUser.password);
        if (!match) throw new handleError(400, 'Email and password doesn\'t match');

        if (foundUser.status == 'inactive') throw new handleError(422, 'User account is inactive.');

        const payload: any = {
            id: foundUser.id,
            fullname: foundUser.fullname,
            email: foundUser.email,
            role: foundUser.role
        };

        if (foundUser.phone) {
            payload.phone = foundUser.phone;
        }

        if (foundUser.role == 'learner') {
            const learner = await Learner.findOne({ user: foundUser.id });
            payload.username = foundUser.username;
            payload.avatar = learner.avatar;
            payload.content_access = learner.content_access;
        }

        if (foundUser.active_organization) payload.organization = foundUser.active_organization;

        const token: string = sign(payload, process.env.JWT_SECRET as string, {
            expiresIn: "24h",
        });
        return {
            ...payload,
            token
        };
    },


    async signUpToEvent(data: object, userId: string): Promise<void> {
        switch (data.event) {
            case 'championship':
                const programId = '';
                break;
            default:
                break;
        }
    },


    async create(userData: IUserCreate): Promise<IUserView | null> {
        const { user_type } = userData;

        const newUserId = await this.createLoginUser(userData);
        const newUser = await this.createUserType(userData, newUserId);
        await this.signUpToEvent(userData, newUserId);
        if (user_type != 'learner' && user_type != 'admin') {
            emailService.sendVerificationEmail(newUser);
        }
        return newUser;
    },


    async createLoginUser({ fullname, email, password, user_type: role, parent, school }: Record<string, any>): Promise<ObjectId> {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const data: Record<string, any> = {
            fullname,
            email,
            role,
            password: passwordHash,
        };

        // for learners added by parents/schools
        if (role === USER_TYPES.learner && (parent || school)) {
            data.username = await this.ensureUniqueUsername((fullname.split(' ').join('.')).toLowerCase());
            data.status = 'active';
        }
        const newUser = await User.create(data);
        return newUser.id;
    },


    async createUserType(userData: IUserCreate, user: ObjectId): Promise<IUserView | null> {
        const { user_type } = userData;

        const userTypeData = getValidModelFields(userModel[user_type], userData);
        userTypeData.user = user;

        switch (user_type) {
            case 'parent':
                await Parent.create(userTypeData);
                break;
            case 'school':
                await School.create(userTypeData);
                break;
            case 'learner':
                await Learner.create(userTypeData);
                break;
        }
        return this.view({ _id: user });
    },

    async activateAccount(email_hash: string, hash_string: string): Promise<IUserView | null> {
        if (!email_hash || !hash_string) {
            throw new handleError(400, 'Email or hash not found');
        }
        const email = Buffer.from(email_hash, 'base64url').toString('ascii');
        const user = await User.findOne({ email }).select(USER_FIELDS);

        if (!user) throw new handleError(400, 'Account not found');

        const hash = crypto.createHash('md5').update(user.email + process.env.EMAIL_HASH_STRING).digest('hex');
        if (hash_string !== hash) {
            throw new handleError(400, 'Invalid hash. couldn\'t verify your email');
        }
        user.status = 'active';
        await user.save();
        return this.view({ _id: user.id });
    },

    async verifyPasswordResetLink(email_hash: string, hash_string: string) {
        if (!email_hash || !hash_string) {
            throw new handleError(400, 'Email or hash not found');
        }
        const email = Buffer.from(email_hash, 'base64url').toString('ascii');
        const user = await this.view({ email });
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

        return User.updateOne({ _id: user_id }, { password: passwordHash });
    },

    async view(criteria: object): Promise<IUserView | null> {
        const user = await User.findOne(criteria).select(USER_FIELDS);
        if (!user) return null;

        let userType = { toJSON: () => { } };

        switch (user?.role) {
            case USER_TYPES.learner:
                userType = await Learner.findOne({ user: new mongoose.Types.ObjectId(user?.id) }).select({ user: 0 });
                break
            case USER_TYPES.parent:
                userType = await Parent.findOne({ user: new mongoose.Types.ObjectId(user?.id) }).select({ user: 0 });
                break
            case USER_TYPES.school:
                userType = await School.findOne({ user: new mongoose.Types.ObjectId(user?.id) }).select({ user: 0 });
                break
        }
        return { ...user?.toJSON(), ...userType?.toJSON(), id: user?.id };
    },

    async list(criteria = {}): Promise<IUserView[] | []> {
        return User.find(criteria).select(USER_FIELDS) || [];
    },

    async update(userId: string, userData: IUserCreate): Promise<IUserView | null> {
        const criteria = { _id: new mongoose.Types.ObjectId(userId) };

        const userUpdateData = getValidModelFields(User, userData);
        await User.updateOne(criteria, userUpdateData);

        switch (userData.role) {
            case USER_TYPES.learner:
                const learnerData = getValidModelFields(Learner, userData);
                await Learner.updateOne({ user: new mongoose.Types.ObjectId(userId) }, learnerData);
                break;
            case USER_TYPES.parent:
                const parentData = getValidModelFields(Parent, userData);
                await Parent.updateOne({ user: new mongoose.Types.ObjectId(userId) }, parentData);
        }
        return this.view(criteria);
    },

    async ensureUniqueUsername(username: string): Promise<String> {
        const foundUsername = await User.findOne({ username }).lean();

        if (foundUsername) {
            const newUsername = username + generateId('', 2, true);
            return this.ensureUniqueUsername(newUsername);
        }
        return username;
    },

    async getParentChildren(parent: string) {
        const learners = await Learner.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $match: {
                    parent: new mongoose.Types.ObjectId(parent),
                    'user.deleted': false
                }
            },
            {
                $project: {
                    __v: 0,
                    'user._id': 0,
                    'user.__v': 0,
                    'user.deleted': 0,
                    'user.password': 0
                }
            }
        ]);
        return learners.map(learner => this.sanitizeLearner(learner));
    },


    async removeLearner(learnerId: string) {
        const learner = await Learner.findById(learnerId);
        if (!learner) throw new handleError(404, 'Learner not found');

        await User.updateOne({ _id: learner.user }, { deleted: true });
    },

    async getUserPayments(userId: string) {
        return paymentService.list({ user: new mongoose.Types.ObjectId(userId) });
    },


    sanitizeLearner(learner: object) {
        const user = { ...learner.user };
        delete learner.user;
        if (learner._id) {
            learner.id = learner._id;
            delete learner._id;
        }
        return {
            ...learner,
            ...user
        };
    },

    async downloadUserData(userType: string) {
        const columns = [
            { label: "Name", value: (row) => row.user.fullname },
            { label: "Email", value: (row) => row.user.email },
            { label: "Phone", value: "phone" },
            { label: "Location", value: "resident_state" },
            { label: "Signed up on", value: (row) => row.user.createdAt, format: "d-mmm-yy" }
        ];

        const users = await userModel[userType].find({}).populate({ path: 'user', select: 'fullname email phone createdAt' });
        return xlsxHelper.write(columns, users, 'parents_mailing_list');
    }
}