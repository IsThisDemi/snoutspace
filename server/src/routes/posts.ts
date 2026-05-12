import { Router, Response } from "express";
import { Types } from "mongoose";
import path from "path";
import fs from "fs";
import { Post } from "../models/Post";
import { Save } from "../models/Save";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { upload } from "./files";

const router = Router();
const UPLOADS_DIR = path.join(__dirname, "../../uploads");

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
        }
      : p.creator,
    __v: undefined,
  };
}

router.get("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 9;
  const cursor = req.query.cursor as string;

  const query: any = {};
  if (cursor && Types.ObjectId.isValid(cursor)) {
    query._id = { $lt: new Types.ObjectId(cursor) };
  }

  const posts = await Post.find(query)
    .sort({ _id: -1 })
    .limit(limit)
    .populate("creator", "-passwordHash");

  const serialized = posts.map(serializePost);
  res.json({ documents: serialized, total: serialized.length });
});

router.get("/recent", requireAuth, async (_req: AuthRequest, res: Response): Promise<void> => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("creator", "-passwordHash");

  res.json({ documents: posts.map(serializePost), total: posts.length });
});

router.get("/search", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const q = req.query.q as string;
  if (!q) {
    res.json({ documents: [], total: 0 });
    return;
  }

  const posts = await Post.find({ caption: { $regex: q, $options: "i" } })
    .sort({ createdAt: -1 })
    .populate("creator", "-passwordHash");

  res.json({ documents: posts.map(serializePost), total: posts.length });
});

router.get("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await Post.findById(req.params.id).populate("creator", "-passwordHash");
  if (!post) {
    res.status(404).json({ message: "Post not found" });
    return;
  }
  res.json(serializePost(post));
});

router.post("/", requireAuth, upload.single("file"), async (req: AuthRequest, res: Response): Promise<void> => {
  const { caption, location, tags } = req.body;

  if (!req.file) {
    res.status(400).json({ message: "Image required" });
    return;
  }

  const imageId = req.file.filename;
  const imageUrl = `${process.env.SERVER_URL || "http://localhost:3001"}/uploads/${imageId}`;
  const tagsArray = tags ? tags.replace(/ /g, "").split(",").filter(Boolean) : [];

  const post = await Post.create({
    creator: req.userId,
    caption,
    imageUrl,
    imageId,
    location: location || "",
    tags: tagsArray,
    likes: [],
  });

  const populated = await post.populate("creator", "-passwordHash");
  res.status(201).json(serializePost(populated));
});

router.put("/:id", requireAuth, upload.single("file"), async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404).json({ message: "Post not found" });
    return;
  }
  if (post.creator.toString() !== req.userId) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const { caption, location, tags } = req.body;
  const tagsArray = tags ? tags.replace(/ /g, "").split(",").filter(Boolean) : post.tags;

  if (req.file) {
    const oldImageId = post.imageId;
    post.imageId = req.file.filename;
    post.imageUrl = `${process.env.SERVER_URL || "http://localhost:3001"}/uploads/${req.file.filename}`;

    const oldPath = path.join(UPLOADS_DIR, oldImageId);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  post.caption = caption ?? post.caption;
  post.location = location ?? post.location;
  post.tags = tagsArray;
  await post.save();

  const populated = await post.populate("creator", "-passwordHash");
  res.json(serializePost(populated));
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404).json({ message: "Post not found" });
    return;
  }
  if (post.creator.toString() !== req.userId) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const imagePath = path.join(UPLOADS_DIR, post.imageId);
  if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

  await Save.deleteMany({ post: post._id });
  await post.deleteOne();
  res.json({ status: "ok" });
});

router.patch("/:id/like", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { likesArray } = req.body;

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { likes: likesArray },
    { new: true }
  ).populate("creator", "-passwordHash");

  if (!post) {
    res.status(404).json({ message: "Post not found" });
    return;
  }
  res.json(serializePost(post));
});

export default router;
