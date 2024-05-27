import mongoose, { Schema } from 'mongoose';

export enum EUserStatus {
    Active = 'active',
    Inactive = 'inactive'
}

export interface IUserCreate {
    fullname: string;
    email: string;
    password: string;
    user_type: string;
    school: string;
    parent?: string;
    contact_person?: string;
    phone?: string,
    resident_state?: string;
    address?: string;
    school_id?: string;
}

export interface IUserModel {
    fullname: string;
    email: string;
    phone?: string;
    password: string;
    username?: string;
    role: string;
    active_organization?: Schema.Types.ObjectId;
    isUserOnboarded?: boolean;
    status: string;
    deleted: boolean
}

export interface IUserView {
    id: Schema.Types.ObjectId;
    fullname: string;
    email: string;
    role: string;
    username?: string;
    active_organization?: Schema.Types.ObjectId;
    isUserOnboarded: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
}

const contentAccess = {
    title: String,
    order: Schema.Types.ObjectId,
    access_type: String,
    access_type_id: Schema.Types.ObjectId,
    slug: String,
    expiry_date: Date
};


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
        index: {
            unique: false,
        }
    },
    username: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        trim: true,
        index: {
            unique: false,
            sparse: true
        }
    },
    active_organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization'
    },
    isUserOnboarded: {
        type: Boolean,
        default: false

    },
    role: String,
    status: {
        type: String,
        default: EUserStatus.Inactive,
        enum: EUserStatus
    },
    deleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });


const RoleSchema: Schema = new Schema({
    role: String,
    permissions: [String]
}, { timestamps: true });

export const Role = mongoose.model('Role', RoleSchema);


const ParentSchema: Schema = new Schema({
    resident_state: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

export const Parent = mongoose.model('Parent', ParentSchema);


export const LearnerSchema: Schema = new Schema({
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'parent'
    },
    parent_email: {
        type: String,
        index: true
    },
    school: {
        type: Schema.Types.ObjectId,
        ref: 'school',
    },
    grade: {
        type: String,
        index: true
    },
    gender: String,
    dob: Date,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    interests: [],
    content_access: [contentAccess],
    avatar: String,
    resident_state: String,
}, { timestamps: true });

export const Learner = mongoose.model('Learner', LearnerSchema);


const SchoolSchema: Schema = new Schema({
    school: {
        type: String,
        unique: true
    },
    school_email:{
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

export const School = mongoose.model('School', SchoolSchema);


const InstructorSchema: Schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    school_id: {
        type: Schema.Types.ObjectId,
        ref: 'school',
    },
}, { timestamps: true });

export const Instructor = mongoose.model('Instructor', InstructorSchema);


const AdminSchema: Schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
}, { timestamps: true });

export const Admin = mongoose.model('Admin', AdminSchema);

export default mongoose.model<IUserModel>('User', UserSchema);
