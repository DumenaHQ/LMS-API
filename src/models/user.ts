import mongoose, { Schema } from "mongoose";


export interface IUserModel {
  fullname: string;
  email: string;
  password: string;
  role: string;
}


const UserSchema: Schema = new Schema(
  {
    fullname: String,
    email: {
      type: String,
      unique: true,
      trim: true
    },
    password: String,
    role: String
  }
);

export default mongoose.model<IUserModel>("User", UserSchema);
