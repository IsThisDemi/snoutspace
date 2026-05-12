import { Router, Response } from "express";
import path from "path";
import fs from "fs";
import { Story } from "../models/Story";
import { Follow } from "../models/Follow";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { upload } from "./files";

const router = Router();
const UPLOADS_DIR = path.join(__dirname, "../../uploads");
const STORY_TTL_MS = 24 * 60 * 60 * 1000;

function serializeStory(story: any, viewerId: string) {
  const s = story.toObject ? story.toObject() : story;
  return {
    id: s._id.toString(),
    imageUrl: s.imageUrl,
    expiresAt: s.expiresAt,
    createdAt: s.createdAt,
    viewerCount: s.viewers?.length ?? 0,
    hasViewed: s.viewers?.map((v: any) => v.toString()).includes(viewerId),
    creator: s.creator
      ? {
          id: s.creator._id?.toString() ?? s.creator.toString(),
          name: s.creator.name,
          username: s.creator.username,
          imageUrl: s.creator.imageUrl,
        }
      : s.creator,
  };
}

router.get("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const following = await Follow.find({ follower: req.userId }).select("following");
  const followingIds = following.map((f) => f.following);

  const stories = await Story.find({
    creator: { $in: [...followingIds, req.userId] },
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .populate("creator", "name username imageUrl");

  const grouped = new Map<string, any[]>();
  for (const story of stories) {
    const creatorId = (story.creator as any)._id?.toString() ?? story.creator.toString();
    if (!grouped.has(creatorId)) grouped.set(creatorId, []);
    grouped.get(creatorId)!.push(serializeStory(story, req.userId!));
  }

  const result = Array.from(grouped.entries()).map(([, userStories]) => ({
    creator: userStories[0].creator,
    stories: userStories,
    hasUnviewed: userStories.some((s) => !s.hasViewed),
  }));

  res.json({ documents: result, total: result.length });
});

router.post("/", requireAuth, upload.single("file"), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: "Image required" });
    return;
  }

  const imageId = req.file.filename;
  const imageUrl = `${process.env.SERVER_URL || "http://localhost:3001"}/uploads/${imageId}`;
  const expiresAt = new Date(Date.now() + STORY_TTL_MS);

  const story = await Story.create({
    creator: req.userId,
    imageUrl,
    imageId,
    viewers: [],
    expiresAt,
  });

  const populated = await story.populate("creator", "name username imageUrl");
  res.status(201).json(serializeStory(populated, req.userId!));
});

router.post("/:id/view", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  await Story.findByIdAndUpdate(req.params.id, {
    $addToSet: { viewers: req.userId },
  });
  res.json({ status: "ok" });
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const story = await Story.findById(req.params.id);
  if (!story) { res.status(404).json({ message: "Story not found" }); return; }
  if (story.creator.toString() !== req.userId) { res.status(403).json({ message: "Forbidden" }); return; }

  const imagePath = path.join(UPLOADS_DIR, story.imageId);
  if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  await story.deleteOne();
  res.json({ status: "ok" });
});

export default router;
