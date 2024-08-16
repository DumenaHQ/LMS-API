import { IUserView } from '../../src/user/models';

declare global {
    namespace Express {
        export interface Request {
            user: IUserView;
            files: any;
        }
    }

    namespace NodeJS {
        interface Global {
            tokens: string
        }
    }
}