import mongoose, { Document, Schema, Types } from "mongoose";

export interface ISaveDocument extends Document {
  user: Types.ObjectId;
  post: Types.ObjectId;
  createdAt: Date;
}

const saveSchema = new Schema<ISaveDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: true }
);

saveSchema.index({ user: 1, post: 1 }, { unique: true });

export const Save = mongoose.model<ISaveDocument>("Save", saveSchema);
