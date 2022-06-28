import User, { IUserView, IUserCreate, Parent, School, Learner } from './models';
import { sign } from "jsonwebtoken";
import { handleError } from "../helpers/handleError";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { Buffer } from 'buffer';
import { ObjectId } from 'mongoose';
import { emailService } from '../helpers/email';

import { SALT_ROUNDS, USER_FIELDS, USER_TYPES } from '../config/constants';


export const userService = {
    async authenticate(emailOrUsername: string, password: string): Promise<object> {
        const foundUser = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] }).lean();
        if (!foundUser) throw new handleError(404, 'Email or password is incorrect');

        const match = await bcrypt.compare(password, foundUser.password);
        if (!match) throw new handleError(400, 'Email and password doesn\'t match');

        const payload: any = {
            fullname: foundUser.fullname,
            role: foundUser.role,
        };

        if (foundUser.role == 'learner' && foundUser.username) {
            payload.username = foundUser.username;
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


    async create(userData: IUserCreate): Promise<IUserView> {
        const { fullname, email, password, user_type } = userData;
        const data = {
            fullname, email, password, user_type
        };

        if (user_type === USER_TYPES.learner) {
            data.username = fullname.split(' ').join('.');
        }

        const newUserId = await this.createLoginUser(data);
        const newUser = await this.createUserType(userData, newUserId);
        if (user_type != 'learner' && user_type != 'admin') {
            emailService.sendVerificationEmail(newUser);
        }
        return newUser;
    },


    async createLoginUser({ fullname, email, username = undefined, password, user_type: role }): Promise<ObjectId> {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const data = {
            fullname,
            email,
            role,
            password: passwordHash,
        };
        if (username) data.username = username;
        const newUser = await User.create(data);
        return newUser.id;
    },


    async createUserType(userData: IUserCreate, user: ObjectId): Promise<IUserView> {
        const { phone, fullname, school, user_type, address, resident_state, parent } = userData;
        let newUser;
        switch (user_type) {
            case 'parent':
                newUser = await Parent.create({ phone, resident_state, user });
                break;
            case 'school':
                const contact_person = fullname;
                newUser = await School.create({ school, phone, contact_person, address, resident_state, user });
                break;
            case 'learner':
                newUser = await Learner.create({ phone, parent: parent ?? null });
                break;
        }
        return User.findById(user).select(USER_FIELDS);
    },

    async activateAccount(email_hash: string, hash_string: string) {
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
        // remove this
        if (user.role == USER_TYPES.school || user.role == USER_TYPES.parent)
            emailService.sendLauchInviteEmail(user);
        return user;
    },

    async verifyPasswordResetLink(email_hash: string, hash_string: string) {
        if (!email_hash || !hash_string) {
            throw new handleError(400, 'Email or hash not found');
        }
        const email = Buffer.from(email_hash, 'base64').toString('ascii');
        const user = await this.view({ email });
        if (!user) throw new handleError(400, 'User not found');

        const hash = crypto.createHash('md5').update(email + process.env.EMAIL_HASH_STRING).digest('hex');
        if (hash_string !== hash) {
            throw new handleError(400, 'Invalid hash. couldn\'t verify your email');
        }
        return { id: user.id, status: true };
    },

    async changePassword(newPassword: string, user_id: string) {
        if (!newPassword) throw new handleError(400, 'Password can not be empty');
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        return User.updateOne({ _id: user_id }, { password: passwordHash });
    },

    async view(criteria: object): Promise<IUserView | null> {
        return User.findOne(criteria).select(USER_FIELDS);
    },

    async list(criteria = {}): Promise<IUserView[] | []> {
        return User.find(criteria).select(USER_FIELDS) || [];
    },

    async update(criteria: object, userData: IUserCreate): Promise<IUserView | null> {
        await User.updateOne(criteria, userData);
        return this.view(criteria);
    }

    // async validateUsername(username: string): Promise<Boolean> {
    //     const foundUsername = await User.findOne({ username }).lean();
    //     if (foundUsername) {

    //         return this.validateUser();
    //     }
    //     return foundUsername ? true : false;
    // }
}