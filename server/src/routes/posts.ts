import { Router, Response } from "express";
import { Types } from "mongoose";
import path from "path";
import fs from "fs";
import { Post } from "../models/Post";
import { Save } from "../models/Save";
import { Comment } from "../models/Comment";
import { Notification } from "../models/Notification";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { upload } from "./files";
import { emitToUser } from "../io";

const router = Router();
const UPLOADS_DIR = path.join(__dirname, "../../uploads");
const SERVER_URL = process.env.SERVER_URL || "http://localhost:3001";

function serializePost(post: any) {
  const p = post.toObject ? post.toObject() : post;
  const result: any = {
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
    images: p.images || [],
    __v: undefined,
  };

  if (p.repostOf && typeof p.repostOf === "object" && p.repostOf._id) {
    result.repostOf = {
      id: p.repostOf._id.toString(),
      caption: p.repostOf.caption,
      imageUrl: p.repostOf.imageUrl,
      images: p.repostOf.images || [],
      creator: p.repostOf.creator
        ? {
            id: p.repostOf.creator._id?.toString() ?? p.repostOf.creator.toString(),
            name: p.repostOf.creator.name,
            username: p.repostOf.creator.username,
            imageUrl: p.repostOf.creator.imageUrl,
          }
        : null,
    };
  }

  return result;
}

function serializeComment(comment: any) {
  const c = comment.toObject ? comment.toObject() : comment;
  return {
    id: c._id.toString(),
    body: c.body,
    parentId: c.parentId?.toString() ?? null,
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

async function notify(
  recipientId: string,
  actorId: string,
  type: "like" | "comment" | "follow" | "reply" | "repost",
  postId?: string,
  commentId?: string
) {
  if (recipientId === actorId) return;
  const doc = await Notification.findOneAndUpdate(
    { recipient: recipientId, actor: actorId, type, post: postId || undefined },
    { recipient: recipientId, actor: actorId, type, post: postId || undefined, comment: commentId || undefined, read: false },
    { upsert: true, new: true }
  );
  emitToUser(recipientId, "notification", {
    id: doc._id.toString(),
    type,
    postId,
    commentId,
    actorId,
    read: false,
    createdAt: doc.createdAt,
  });
}

// ── GET list ─────────────────────────────────────────────────────────────────

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
    .populate("creator", "-passwordHash")
    .populate({ path: "repostOf", populate: { path: "creator", select: "-passwordHash" } });

  const serialized = posts.map(serializePost);
  res.json({ documents: serialized, total: serialized.length });
});

router.get("/recent", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { User } = await import("../models/User");
  const currentUser = await User.findById(req.userId).select("blocked muted");
  const excludedIds = [
    ...(currentUser?.blocked?.map((id) => id.toString()) ?? []),
    ...(currentUser?.muted?.map((id) => id.toString()) ?? []),
  ];

  const posts = await Post.find({ creator: { $nin: excludedIds } })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("creator", "-passwordHash")
    .populate({ path: "repostOf", populate: { path: "creator", select: "-passwordHash" } });

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

  const populated = await Post.populate(posts, [
    { path: "creator", select: "-passwordHash" },
    { path: "repostOf", populate: { path: "creator", select: "-passwordHash" } },
  ]);
  res.json({ documents: (populated as any[]).map(serializePost), total: populated.length });
});

router.get("/tag/:tag", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const tag = req.params.tag.toLowerCase();
  const posts = await Post.find({ tags: tag })
    .sort({ createdAt: -1 })
    .populate("creator", "-passwordHash")
    .populate({ path: "repostOf", populate: { path: "creator", select: "-passwordHash" } });

  res.json({ documents: posts.map(serializePost), total: posts.length });
});

router.get("/search", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const q = req.query.q as string;
  const searchTags = req.query.searchTags === "true";
  if (!q) {
    res.json({ documents: [], total: 0 });
    return;
  }

  const filter = searchTags
    ? { tags: { $regex: q, $options: "i" } }
    : { caption: { $regex: q, $options: "i" } };

  const posts = await Post.find(filter)
    .sort({ createdAt: -1 })
    .populate("creator", "-passwordHash")
    .populate({ path: "repostOf", populate: { path: "creator", select: "-passwordHash" } });

  res.json({ documents: posts.map(serializePost), total: posts.length });
});

router.get("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await Post.findById(req.params.id)
    .populate("creator", "-passwordHash")
    .populate({ path: "repostOf", populate: { path: "creator", select: "-passwordHash" } });

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

// ── CREATE ────────────────────────────────────────────────────────────────────

router.post("/", requireAuth, upload.array("files", 10), async (req: AuthRequest, res: Response): Promise<void> => {
  const { caption, location, tags } = req.body;
  const files = (req as any).files as Express.Multer.File[] | undefined;

  // Support both `files` (multi) and legacy `file` (single from multer.single)
  const fileList = files && files.length > 0 ? files : [];
  if (fileList.length === 0) {
    res.status(400).json({ message: "At least one image required" });
    return;
  }

  const images = fileList.map((f) => ({
    url: `${SERVER_URL}/uploads/${f.filename}`,
    id: f.filename,
  }));

  const tagsArray = tags ? tags.replace(/ /g, "").split(",").filter(Boolean) : [];

  const post = await Post.create({
    creator: req.userId,
    caption,
    imageUrl: images[0].url,
    imageId: images[0].id,
    images,
    location: location || "",
    tags: tagsArray,
    likes: [],
  });

  const populated = await post.populate([
    { path: "creator", select: "-passwordHash" },
  ]);
  res.status(201).json(serializePost(populated));
});

// ── REPOST ────────────────────────────────────────────────────────────────────

router.post("/:id/repost", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const original = await Post.findById(req.params.id).populate("creator", "-passwordHash");
  if (!original) {
    res.status(404).json({ message: "Post not found" });
    return;
  }

  const existing = await Post.findOne({ creator: req.userId, repostOf: req.params.id });
  if (existing) {
    res.status(409).json({ message: "Already reposted" });
    return;
  }

  const post = await Post.create({
    creator: req.userId,
    caption: original.caption,
    imageUrl: original.imageUrl,
    imageId: original.imageId,
    images: (original as any).images || [],
    location: original.location,
    tags: original.tags,
    likes: [],
    repostOf: req.params.id,
  });

  const populated = await Post.findById(post._id)
    .populate("creator", "-passwordHash")
    .populate({ path: "repostOf", populate: { path: "creator", select: "-passwordHash" } });

  const creatorId = (original.creator as any)._id?.toString() ?? original.creator.toString();
  await notify(creatorId, req.userId!, "repost", req.params.id);

  res.status(201).json(serializePost(populated));
});

// ── UPDATE ────────────────────────────────────────────────────────────────────

router.put("/:id", requireAuth, upload.array("files", 10), async (req: AuthRequest, res: Response): Promise<void> => {
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
  const files = (req as any).files as Express.Multer.File[] | undefined;
  const tagsArray = tags ? tags.replace(/ /g, "").split(",").filter(Boolean) : post.tags;

  if (files && files.length > 0) {
    // Delete old images
    const oldImages: { id: string }[] = (post as any).images || [];
    if (oldImages.length > 0) {
      oldImages.forEach(({ id }) => {
        const p = path.join(UPLOADS_DIR, id);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      });
    } else if (post.imageId) {
      const p = path.join(UPLOADS_DIR, post.imageId);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }

    const newImages = files.map((f) => ({
      url: `${SERVER_URL}/uploads/${f.filename}`,
      id: f.filename,
    }));
    post.images = newImages;
    post.imageUrl = newImages[0].url;
    post.imageId = newImages[0].id;
  }

  post.caption = caption ?? post.caption;
  post.location = location ?? post.location;
  post.tags = tagsArray;
  await post.save();

  const populated = await Post.findById(post._id)
    .populate("creator", "-passwordHash")
    .populate({ path: "repostOf", populate: { path: "creator", select: "-passwordHash" } });
  res.json(serializePost(populated));
});

// ── DELETE ────────────────────────────────────────────────────────────────────

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

  const imagesToDelete: string[] = (post as any).images?.length
    ? (post as any).images.map((img: any) => img.id)
    : post.imageId
    ? [post.imageId]
    : [];

  imagesToDelete.forEach((imageId) => {
    const p = path.join(UPLOADS_DIR, imageId);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  // Also delete any reposts
  await Post.deleteMany({ repostOf: post._id });
  await Save.deleteMany({ post: post._id });
  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();
  res.json({ status: "ok" });
});

// ── LIKE ──────────────────────────────────────────────────────────────────────

router.patch("/:id/like", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { likesArray } = req.body;

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { likes: likesArray },
    { new: true }
  )
    .populate("creator", "-passwordHash")
    .populate({ path: "repostOf", populate: { path: "creator", select: "-passwordHash" } });

  if (!post) {
    res.status(404).json({ message: "Post not found" });
    return;
  }

  if (Array.isArray(likesArray) && likesArray.includes(req.userId)) {
    const creatorId = (post.creator as any)._id?.toString() ?? post.creator.toString();
    await notify(creatorId, req.userId!, "like", req.params.id);
  }

  res.json(serializePost(post));
});

// ── COMMENTS ──────────────────────────────────────────────────────────────────

router.get("/:id/comments", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const comments = await Comment.find({ post: req.params.id })
    .sort({ createdAt: 1 })
    .populate("author", "name username imageUrl");

  res.json({ documents: comments.map(serializeComment), total: comments.length });
});

router.post("/:id/comments", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { body, parentId } = req.body;
  if (!body?.trim()) {
    res.status(400).json({ message: "Comment body required" });
    return;
  }

  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404).json({ message: "Post not found" });
    return;
  }

  const comment = await Comment.create({
    post: req.params.id,
    author: req.userId,
    body: body.trim(),
    parentId: parentId && Types.ObjectId.isValid(parentId) ? parentId : null,
  });

  if (parentId) {
    const parent = await Comment.findById(parentId);
    if (parent) {
      await notify(parent.author.toString(), req.userId!, "reply", req.params.id, comment._id.toString());
    }
  } else {
    await notify(post.creator.toString(), req.userId!, "comment", req.params.id, comment._id.toString());
  }

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

  // Also delete replies to this comment
  await Comment.deleteMany({ parentId: comment._id });
  await comment.deleteOne();
  res.json({ status: "ok" });
});

export default router;
