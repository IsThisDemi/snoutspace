import { Router, Response } from "express";
import { Save } from "../models/Save";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { postId } = req.body;
  if (!postId) {
    res.status(400).json({ message: "postId required" });
    return;
  }

  const save = await Save.create({ user: req.userId, post: postId });
  res.status(201).json({ id: save._id.toString(), user: req.userId, post: postId });
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const save = await Save.findById(req.params.id);
  if (!save) {
    res.status(404).json({ message: "Save not found" });
    return;
  }
  if (save.user.toString() !== req.userId) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  await save.deleteOne();
  res.json({ status: "ok" });
});

export default router;
