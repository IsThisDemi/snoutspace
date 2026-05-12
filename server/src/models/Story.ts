import mongoose, { Document, Schema } from "mongoose";

export interface IStoryDocument extends Document {
  creator: mongoose.Types.ObjectId;
  imageUrl: string;
  imageId: string;
  viewers: mongoose.Types.ObjectId[];
  expiresAt: Date;
  createdAt: Date;
}

const storySchema = new Schema<IStoryDocument>(
  {
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl: { type: String, required: true },
    imageId: { type: String, required: true },
    viewers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Story = mongoose.model<IStoryDocument>("Story", storySchema);
