import User, { IUserView, IUserCreate, Parent, School } from './models';
import { sign } from "jsonwebtoken";
import { handleError } from "../helpers/handleError";
import * as bcrypt from "bcrypt";
import { ObjectId } from 'mongoose';

import { SALT_ROUNDS, USER_FIELDS, USER_TYPES } from '../config/constants';


export const userService = {
    async authenticate(email: string, password: string): Promise<object> {
        const foundUser = await User.findOne({ email }).lean();
        if (!foundUser) throw new handleError(404, 'Email or password is incorrect');

        const match = await bcrypt.compare(password, foundUser.password);
        if (!match) throw new handleError(400, 'Email and password doesn\'t match');

        const payload: any = {
            fullname: foundUser.fullname,
            role: foundUser.role,
        };

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

        if (user_type === USER_TYPES.school && !userData.school) {
            throw new handleError(400, 'School name must be provided');
        }

        const newUserId = await this.createLoginUser(fullname, email, password, user_type);
        return this.createUserType(userData, newUserId);
    },


    async createLoginUser(fullname: string, email: string, password: string, role: string): Promise<ObjectId> {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const data = {
            fullname,
            email,
            role,
            password: passwordHash,
        };
        const newUser = await User.create(data);
        return newUser.id;
    },


    async createUserType(userData: IUserCreate, user: ObjectId): Promise<IUserView> {
        const { phone, fullname: contact_person, school, user_type, address, resident_state } = userData;
        let newUser;
        switch (user_type) {
            case 'parent':
                newUser = await Parent.create({ phone, resident_state, user });
                break;
            case 'school':
                newUser = await School.create({ school, phone, contact_person, address, resident_state, user });
                break;
        }
        return User.findById(user).select(USER_FIELDS);
    }
}