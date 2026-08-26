import { Schema, models, model, Document, Types } from "mongoose";

export interface ICommunity extends Document {
  name: string;
  slug: string;
  description: string;
  category: string;
  image?: string;
  createdBy: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CommunitySchema = new Schema<ICommunity>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    image: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default models.Community || model<ICommunity>("Community", CommunitySchema);

export type LeanCommunity = Omit<ICommunity, keyof Document> & { _id: Types.ObjectId };
