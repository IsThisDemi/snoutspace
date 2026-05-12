import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPostDocument extends Document {
  creator: Types.ObjectId;
  caption: string;
  imageUrl: string;
  imageId: string;
  location: string;
  tags: string[];
  likes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPostDocument>(
  {
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    caption: { type: String, required: true },
    imageUrl: { type: String, required: true },
    imageId: { type: String, required: true },
    location: { type: String, default: "" },
    tags: [{ type: String }],
    likes: [{ type: String }],
  },
  { timestamps: true }
);

postSchema.index({ caption: "text" });

export const Post = mongoose.model<IPostDocument>("Post", postSchema);
