import { Schema, models, model, Document, Types } from "mongoose";

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags: string[];
  author: Types.ObjectId;
  status: "draft" | "published";
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    coverImage: { type: String },
    tags: { type: [String], default: [] },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

export default models.Blog || model<IBlog>("Blog", BlogSchema);

// Shape returned by `.lean()` queries — a plain object (no Mongoose Document
// methods), but with `_id`/`author` still as ObjectId until serialized.
// Used across pages/route handlers instead of `as any` casts.
export type LeanBlog = Omit<IBlog, keyof Document> & { _id: Types.ObjectId };
