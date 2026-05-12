import { Router, Response } from "express";
import path from "path";
import fs from "fs";
import { User } from "../models/User";
import { Post } from "../models/Post";
import { Save } from "../models/Save";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { upload } from "./files";

const router = Router();
const UPLOADS_DIR = path.join(__dirname, "../../uploads");

function serializeUser(user: any) {
  const u = user.toObject ? user.toObject() : user;
  return {
    ...u,
    id: u._id.toString(),
    _id: undefined,
    passwordHash: undefined,
    __v: undefined,
  };
}

function serializePost(post: any) {
  const p = post.toObject ? post.toObject() : post;
  return {
    ...p,
    id: p._id.toString(),
    _id: undefined,
    creator: p.creator
      ? {
          ...p.creator,
          id: p.creator._id?.toString() ?? p.creator.toString(),
          _id: undefined,
          passwordHash: undefined,
        }
      : p.creator,
    __v: undefined,
  };
}

router.get("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

  let query = User.find().sort({ createdAt: -1 });
  if (limit) query = query.limit(limit);

  const users = await query;
  res.json({ documents: users.map(serializeUser), total: users.length });
});

router.get("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const [saves, posts] = await Promise.all([
    Save.find({ user: user._id }).populate({
      path: "post",
      populate: { path: "creator", select: "-passwordHash" },
    }),
    Post.find({ creator: user._id }).sort({ createdAt: -1 }).populate("creator", "-passwordHash"),
  ]);

  const serializedSaves = saves.map((s: any) => ({
    id: s._id.toString(),
    post: s.post ? serializePost(s.post) : null,
    createdAt: s.createdAt,
  }));

  res.json({ ...serializeUser(user), save: serializedSaves, posts: posts.map(serializePost) });
});

router.get("/:userId/posts", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const posts = await Post.find({ creator: req.params.userId })
    .sort({ createdAt: -1 })
    .populate("creator", "-passwordHash");

  res.json({ documents: posts.map(serializePost), total: posts.length });
});

router.put("/:id", requireAuth, upload.single("file"), async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.params.id !== req.userId) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const { name, bio } = req.body;

  if (req.file) {
    const oldImageId = user.imageId;
    user.imageId = req.file.filename;
    user.imageUrl = `${process.env.SERVER_URL || "http://localhost:3001"}/uploads/${req.file.filename}`;

    if (oldImageId) {
      const oldPath = path.join(UPLOADS_DIR, oldImageId);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
  }

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  await user.save();

  res.json(serializeUser(user));
});

export default router;
