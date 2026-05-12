import { Router, Response } from "express";
import { Report } from "../models/Report";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { targetType, targetId, reason } = req.body;

  if (!targetType || !targetId || !reason?.trim()) {
    res.status(400).json({ message: "targetType, targetId and reason are required" });
    return;
  }

  const existing = await Report.findOne({ reporter: req.userId, targetType, targetId });
  if (existing) {
    res.status(409).json({ message: "Already reported" });
    return;
  }

  const report = await Report.create({ reporter: req.userId, targetType, targetId, reason: reason.trim() });
  res.status(201).json({ id: report._id.toString(), status: report.status });
});

router.get("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const reports = await Report.find()
    .sort({ createdAt: -1 })
    .populate("reporter", "name username imageUrl");

  const docs = reports.map((r) => ({
    id: r._id.toString(),
    targetType: r.targetType,
    targetId: r.targetId,
    reason: r.reason,
    status: r.status,
    createdAt: r.createdAt,
    reporter: r.reporter,
  }));

  res.json({ documents: docs, total: docs.length });
});

router.patch("/:id/status", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.body;
  if (!["reviewed", "dismissed"].includes(status)) {
    res.status(400).json({ message: "Invalid status" });
    return;
  }
  const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!report) { res.status(404).json({ message: "Not found" }); return; }
  res.json({ id: report._id.toString(), status: report.status });
});

export default router;
