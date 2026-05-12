import mongoose, { Document, Schema } from "mongoose";

export interface IFollowDocument extends Document {
  follower: mongoose.Types.ObjectId;
  following: mongoose.Types.ObjectId;
  createdAt: Date;
}

const followSchema = new Schema<IFollowDocument>(
  {
    follower: { type: Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });

export const Follow = mongoose.model<IFollowDocument>("Follow", followSchema);
