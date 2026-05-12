import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { Save } from "../models/Save";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

function serializePostForSave(post: any) {
  const p = post.toObject ? post.toObject() : post;
  return {
    ...p,
    id: p._id.toString(),
    _id: undefined,
    creator: p.creator
      ? { ...p.creator, id: p.creator._id?.toString() ?? p.creator.toString(), _id: undefined, passwordHash: undefined }
      : p.creator,
    __v: undefined,
  };
}

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function signToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

function serializeUser(user: InstanceType<typeof User>) {
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    imageUrl: user.imageUrl,
    imageId: user.imageId,
    bio: user.bio,
    createdAt: user.createdAt,
  };
}

router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  const { name, email, username, password } = req.body;

  if (!name || !email || !username || !password) {
    res.status(400).json({ message: "All fields required" });
    return;
  }

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    res.status(409).json({ message: "Email or username already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  const imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&size=200`;

  const user = await User.create({ name, email, username, passwordHash, imageUrl });
  const token = signToken(user._id.toString());

  res.cookie("token", token, COOKIE_OPTS).status(201).json(serializeUser(user));
});

router.post("/signin", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const token = signToken(user._id.toString());
  res.cookie("token", token, COOKIE_OPTS).json(serializeUser(user));
});

router.post("/signout", (_req: Request, res: Response): void => {
  res.clearCookie("token").json({ status: "ok" });
});

router.get("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const saves = await Save.find({ user: user._id }).populate({
    path: "post",
    populate: { path: "creator", select: "-passwordHash" },
  });

  const serializedSaves = saves.map((s: any) => ({
    id: s._id.toString(),
    post: s.post ? serializePostForSave(s.post) : null,
    createdAt: s.createdAt,
  }));

  res.json({ ...serializeUser(user), save: serializedSaves });
});

export default router;
