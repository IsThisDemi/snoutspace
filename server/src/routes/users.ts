import { Router, Response } from "express";
import path from "path";
import fs from "fs";
import { User } from "../models/User";
import { Post } from "../models/Post";
import { Save } from "../models/Save";
import { Follow } from "../models/Follow";
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
    isPrivate: u.isPrivate ?? false,
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
  const q = req.query.q as string | undefined;

  let dbQuery: any = {};
  if (q) {
    dbQuery = {
      $or: [
        { name: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
      ],
    };
  }

  let query = User.find(dbQuery).sort({ createdAt: -1 });
  if (limit) query = query.limit(limit);

  const users = await query;

  const followingSet = new Set(
    (await Follow.find({ follower: req.userId }).select("following")).map(
      (f) => f.following.toString()
    )
  );

  const docs = await Promise.all(
    users.map(async (u) => {
      const [followerCount, followingCount] = await Promise.all([
        Follow.countDocuments({ following: u._id }),
        Follow.countDocuments({ follower: u._id }),
      ]);
      return {
        ...serializeUser(u),
        followerCount,
        followingCount,
        isFollowedByCurrentUser: followingSet.has(u._id.toString()),
      };
    })
  );

  res.json({ documents: docs, total: docs.length });
});

router.get("/u/:username", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const [followerCount, followingCount, existingFollow] = await Promise.all([
    Follow.countDocuments({ following: user._id }),
    Follow.countDocuments({ follower: user._id }),
    Follow.findOne({ follower: req.userId, following: user._id }),
  ]);
  res.json({
    ...serializeUser(user),
    followerCount,
    followingCount,
    isFollowedByCurrentUser: !!existingFollow,
  });
});

router.get("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const [followerCount, followingCount, existingFollow] = await Promise.all([
    Follow.countDocuments({ following: user._id }),
    Follow.countDocuments({ follower: user._id }),
    Follow.findOne({ follower: req.userId, following: user._id }),
  ]);

  const isFollowing = !!existingFollow;
  const isOwnProfile = req.userId === user._id.toString();

  if (user.isPrivate && !isFollowing && !isOwnProfile) {
    res.json({
      ...serializeUser(user),
      followerCount,
      followingCount,
      isFollowedByCurrentUser: false,
      isPrivateBlocked: true,
      save: [],
      posts: [],
    });
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

  res.json({
    ...serializeUser(user),
    save: serializedSaves,
    posts: posts.map(serializePost),
    followerCount,
    followingCount,
    isFollowedByCurrentUser: isFollowing,
  });
});

router.get("/:userId/posts", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const posts = await Post.find({ creator: req.params.userId })
    .sort({ createdAt: -1 })
    .populate("creator", "-passwordHash");

  res.json({ documents: posts.map(serializePost), total: posts.length });
});

router.post("/:id/follow", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.params.id === req.userId) {
    res.status(400).json({ message: "Cannot follow yourself" });
    return;
  }

  const target = await User.findById(req.params.id);
  if (!target) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  await Follow.findOneAndUpdate(
    { follower: req.userId, following: req.params.id },
    { follower: req.userId, following: req.params.id },
    { upsert: true, new: true }
  );

  const followerCount = await Follow.countDocuments({ following: req.params.id });
  res.json({ followerCount });
});

router.delete("/:id/follow", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  await Follow.findOneAndDelete({ follower: req.userId, following: req.params.id });
  const followerCount = await Follow.countDocuments({ following: req.params.id });
  res.json({ followerCount });
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

  const { name, bio, isPrivate } = req.body;

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
  if (isPrivate !== undefined) user.isPrivate = isPrivate === "true" || isPrivate === true;
  await user.save();

  res.json(serializeUser(user));
});

export default router;
