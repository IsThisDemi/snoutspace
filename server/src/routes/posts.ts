import { Router, Response } from "express";
import { Types } from "mongoose";
import path from "path";
import fs from "fs";
import { Post } from "../models/Post";
import { Save } from "../models/Save";
import { Comment } from "../models/Comment";
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

function serializeComment(comment: any) {
  const c = comment.toObject ? comment.toObject() : comment;
  return {
    id: c._id.toString(),
    body: c.body,
    createdAt: c.createdAt,
    author: c.author
      ? {
          id: c.author._id?.toString() ?? c.author.toString(),
          name: c.author.name,
          username: c.author.username,
          imageUrl: c.author.imageUrl,
        }
      : c.author,
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

router.get("/trending", requireAuth, async (_req: AuthRequest, res: Response): Promise<void> => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const posts = await Post.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $addFields: { likeCount: { $size: "$likes" } } },
    { $sort: { likeCount: -1, createdAt: -1 } },
    { $limit: 20 },
  ]);

  const populated = await Post.populate(posts, { path: "creator", select: "-passwordHash" });
  res.json({ documents: populated.map(serializePost), total: populated.length });
});

router.get("/tag/:tag", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const tag = req.params.tag.toLowerCase();
  const posts = await Post.find({ tags: tag })
    .sort({ createdAt: -1 })
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
  const [commentCount, saveCount] = await Promise.all([
    Comment.countDocuments({ post: post._id }),
    Save.countDocuments({ post: post._id }),
  ]);
  res.json({ ...serializePost(post), commentCount, saveCount });
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
  await Comment.deleteMany({ post: post._id });
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

// ── Comments ──────────────────────────────────────────────────────────────────

router.get("/:id/comments", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const comments = await Comment.find({ post: req.params.id })
    .sort({ createdAt: 1 })
    .populate("author", "name username imageUrl");

  res.json({ documents: comments.map(serializeComment), total: comments.length });
});

router.post("/:id/comments", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { body } = req.body;
  if (!body?.trim()) {
    res.status(400).json({ message: "Comment body required" });
    return;
  }

  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404).json({ message: "Post not found" });
    return;
  }

  const comment = await Comment.create({ post: req.params.id, author: req.userId, body: body.trim() });
  const populated = await comment.populate("author", "name username imageUrl");
  res.status(201).json(serializeComment(populated));
});

router.delete("/:id/comments/:commentId", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) {
    res.status(404).json({ message: "Comment not found" });
    return;
  }
  if (comment.author.toString() !== req.userId) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  await comment.deleteOne();
  res.json({ status: "ok" });
});

export default router;
