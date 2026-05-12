import mongoose, { Document, Schema } from "mongoose";

export interface IUserDocument extends Document {
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  imageUrl: string;
  imageId: string;
  bio: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    imageId: { type: String, default: "" },
    bio: { type: String, default: "" },
    isPrivate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUserDocument>("User", userSchema);
