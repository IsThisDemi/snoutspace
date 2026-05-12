import { Router, Response } from "express";
import { Notification } from "../models/Notification";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

function serialize(n: any) {
  const obj = n.toObject ? n.toObject() : n;
  return {
    id: obj._id.toString(),
    type: obj.type,
    read: obj.read,
    createdAt: obj.createdAt,
    actor: obj.actor
      ? {
          id: obj.actor._id?.toString() ?? obj.actor.toString(),
          name: obj.actor.name,
          username: obj.actor.username,
          imageUrl: obj.actor.imageUrl,
        }
      : null,
    post: obj.post
      ? {
          id: obj.post._id?.toString() ?? obj.post.toString(),
          imageUrl: obj.post.imageUrl,
          caption: obj.post.caption,
        }
      : null,
    comment: obj.comment
      ? {
          id: obj.comment._id?.toString() ?? obj.comment.toString(),
          body: obj.comment.body,
        }
      : null,
  };
}

router.get("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const notifications = await Notification.find({ recipient: req.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("actor", "name username imageUrl")
    .populate("post", "imageUrl caption")
    .populate("comment", "body");

  res.json({ documents: notifications.map(serialize), total: notifications.length });
});

router.get("/unread-count", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const count = await Notification.countDocuments({ recipient: req.userId, read: false });
  res.json({ count });
});

router.patch("/read", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  await Notification.updateMany({ recipient: req.userId, read: false }, { read: true });
  res.json({ status: "ok" });
});

export default router;
