import mongoose, { Schema } from "mongoose";

export interface IUserCreate {
    fullname: string;
    email: string;
    password: string;
    user_type: string;
    school: string;
    contact_person?: string;
    phone?: string,
    resident_state?: string;
    address?: string;
};

export interface IUserModel {
    fullname: string;
    email: string;
    phone?: string;
    password: string;
    username?: string;
    role: string;
    active_organization?: Schema.Types.ObjectId;
    status: string;
}

export interface IUserView {
    id: Schema.Types.ObjectId;
    fullname: string;
    email: string;
    role: string;
    active_organization?: Schema.Types.ObjectId;
    status: string;
    createdAt: string;
    updatedAt: string;
}


const UserSchema: Schema = new Schema({
    fullname: String,
    email: {
        type: String,
        trim: true,
        index: {
            unique: true,
            sparse: true
        }
    },
    phone: {
        type: String,
        unique: true
    },
    username: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        trim: true
    },
    active_organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization'
    },
    role: String,
    status: {
        type: String,
        default: 'inactive'
    }
}, { timestamps: true });


const RoleSchema: Schema = new Schema({
    role: String,
    permissions: [String]
}, { timestamps: true });

export const Role = mongoose.model("Role", RoleSchema);


const ParentSchema: Schema = new Schema({
    resident_state: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

export const Parent = mongoose.model("Parent", ParentSchema);


export const LearnerSchema: Schema = new Schema({
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'parent'
    },
    school: {
        type: Schema.Types.ObjectId,
        ref: 'school'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    avatar: String,
    resident_state: String,
}, { timestamps: true });

export const Learner = mongoose.model("Learner", LearnerSchema);


const SchoolSchema: Schema = new Schema({
    school: {
        type: String,
        unique: true
    },
    address: String,
    resident_state: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

export const School = mongoose.model("School", SchoolSchema);


const InstructorSchema: Schema = new Schema({
    fullname: String,
    email: {
        type: String,
        unique: true
    },
    phone: {
        type: String,
        unique: true
    }
}, { timestamps: true });

export const Instructor = mongoose.model("Instructor", SchoolSchema);


export default mongoose.model<IUserModel>("User", UserSchema);
