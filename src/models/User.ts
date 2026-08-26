import { Schema, models, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  password?: string;
  image?: string;
  headline?: string;
  bio?: string;
  skills: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  providerIds: {
    google?: string;
    github?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    // select: false keeps the hash out of every default query result;
    // must explicitly .select("+password") to read it (only done in auth.ts)
    password: { type: String, select: false },
    image: { type: String },
    headline: { type: String, trim: true },
    bio: { type: String, trim: true },
    skills: { type: [String], default: [] },
    githubUrl: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    providerIds: {
      google: { type: String },
      github: { type: String },
    },
  },
  { timestamps: true }
);

export default models.User || model<IUser>("User", UserSchema);

export type LeanUser = Omit<IUser, keyof Document> & { _id: Types.ObjectId };
