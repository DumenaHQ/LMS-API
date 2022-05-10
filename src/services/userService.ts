import userModel, { IUserModel } from '../models/user';
import { sign } from "jsonwebtoken";
import { handleError } from "../helpers/handleError";
import * as bcrypt from "bcrypt";
const saltRounds = 10;
const USER_FIELDS = 'fullname email role createdAt';

export const create = async ({ fullname, email, role, password }: IUserModel): Promise<IUserModel> => {
    const existingUser = await userModel.findOne({ email }).lean();
    if (existingUser) throw new handleError(400, 'Email already in use');

    const passwordHash = await bcrypt.hash(password, saltRounds);
    const data = {
        fullname,
        email,
        role,
        password: passwordHash
    };
    const newUser = await userModel.create(data);
    return userModel.findById(newUser._id).select(USER_FIELDS).lean();
}

export const authenticate = async (email: string, password: string) => {
    const foundUser = await userModel.findOne({ email }).lean();
    if (!foundUser) throw new handleError(404, 'Email or password is incorrect');

    const match = await bcrypt.compare(password, foundUser.password);
    if (!match) throw new handleError(400, 'Email and password doesn\'t match');

    const payload = {
        role: foundUser.role
    };
    const token: string = sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: "24h",
    });
    return {
        ...payload,
        token
    };
}