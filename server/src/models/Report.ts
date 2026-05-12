import mongoose, { Document, Schema } from "mongoose";

export type ReportTargetType = "post" | "user" | "comment";
export type ReportStatus = "pending" | "reviewed" | "dismissed";

export interface IReportDocument extends Document {
  reporter: mongoose.Types.ObjectId;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: Date;
}

const reportSchema = new Schema<IReportDocument>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["post", "user", "comment"], required: true },
    targetId: { type: String, required: true },
    reason: { type: String, required: true, maxlength: 500 },
    status: { type: String, enum: ["pending", "reviewed", "dismissed"], default: "pending" },
  },
  { timestamps: true }
);

reportSchema.index({ reporter: 1, targetId: 1, targetType: 1 }, { unique: true });

export const Report = mongoose.model<IReportDocument>("Report", reportSchema);
