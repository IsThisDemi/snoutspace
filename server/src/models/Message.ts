import mongoose, { Document, Schema } from "mongoose";

export interface IMessageDocument extends Document {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  body: string;
  read: boolean;
  createdAt: Date;
}

const messageSchema = new Schema<IMessageDocument>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, maxlength: 2000 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Message = mongoose.model<IMessageDocument>("Message", messageSchema);
