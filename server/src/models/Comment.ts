import mongoose, { Document, Schema } from "mongoose";

export interface ICommentDocument extends Document {
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  body: string;
  parentId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<ICommentDocument>(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, maxlength: 500 },
    parentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
  },
  { timestamps: true }
);

export const Comment = mongoose.model<ICommentDocument>("Comment", commentSchema);
