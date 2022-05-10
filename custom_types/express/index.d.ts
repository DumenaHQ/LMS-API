import { IUserModel } from '../../src/models/user';

declare global {
    namespace Express {
        export interface Request {
            user: IUserModel;
        }
    }

    namespace NodeJS {
        interface Global {
            tokens: string
        }
    }
}