import { Schema, models, model, Document, Types } from "mongoose";

export interface IMembership extends Document {
  user: Types.ObjectId;
  community: Types.ObjectId;
  role: "member" | "admin";
  joinedAt: Date;
}

const MembershipSchema = new Schema<IMembership>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  community: { type: Schema.Types.ObjectId, ref: "Community", required: true },
  role: { type: String, enum: ["member", "admin"], default: "member" },
  joinedAt: { type: Date, default: Date.now },
});

MembershipSchema.index({ user: 1, community: 1 }, { unique: true });

export default models.Membership || model<IMembership>("Membership", MembershipSchema);
