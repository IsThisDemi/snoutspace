import { Router, Response } from "express";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { User } from "../models/User";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

function serializeMessage(msg: any) {
  const m = msg.toObject ? msg.toObject() : msg;
  return {
    id: m._id.toString(),
    body: m.body,
    read: m.read,
    createdAt: m.createdAt,
    sender: m.sender
      ? { id: m.sender._id?.toString() ?? m.sender.toString(), name: m.sender.name, username: m.sender.username, imageUrl: m.sender.imageUrl }
      : m.sender,
  };
}

function serializeConversation(conv: any, currentUserId: string) {
  const c = conv.toObject ? conv.toObject() : conv;
  const other = c.participants.find((p: any) => (p._id?.toString() ?? p.toString()) !== currentUserId);
  return {
    id: c._id.toString(),
    other: other
      ? { id: other._id?.toString() ?? other.toString(), name: other.name, username: other.username, imageUrl: other.imageUrl }
      : null,
    lastMessage: c.lastMessage ? serializeMessage(c.lastMessage) : null,
    updatedAt: c.updatedAt,
  };
}

router.get("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const conversations = await Conversation.find({ participants: req.userId })
    .sort({ updatedAt: -1 })
    .populate("participants", "name username imageUrl")
    .populate({ path: "lastMessage", populate: { path: "sender", select: "name username imageUrl" } });

  res.json({ documents: conversations.map((c) => serializeConversation(c, req.userId!)), total: conversations.length });
});

router.get("/:conversationId", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const conv = await Conversation.findById(req.params.conversationId);
  if (!conv || !conv.participants.map((p) => p.toString()).includes(req.userId!)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  await Message.updateMany({ conversation: conv._id, sender: { $ne: req.userId } }, { read: true });

  const messages = await Message.find({ conversation: conv._id })
    .sort({ createdAt: 1 })
    .populate("sender", "name username imageUrl");

  res.json({ documents: messages.map(serializeMessage), total: messages.length });
});

router.post("/with/:userId", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { body } = req.body;
  if (!body?.trim()) { res.status(400).json({ message: "Message body required" }); return; }

  const recipient = await User.findById(req.params.userId);
  if (!recipient) { res.status(404).json({ message: "User not found" }); return; }

  let conv = await Conversation.findOne({ participants: { $all: [req.userId, req.params.userId], $size: 2 } });
  if (!conv) {
    conv = await Conversation.create({ participants: [req.userId, req.params.userId] });
  }

  const message = await Message.create({ conversation: conv._id, sender: req.userId, body: body.trim() });
  conv.lastMessage = message._id as any;
  conv.updatedAt = new Date();
  await conv.save();

  const populated = await message.populate("sender", "name username imageUrl");
  res.status(201).json(serializeMessage(populated));
});

export default router;
