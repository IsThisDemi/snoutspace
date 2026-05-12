import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import mongoose from "mongoose";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import authRoutes from "./routes/auth";
import postRoutes from "./routes/posts";
import userRoutes from "./routes/users";
import saveRoutes from "./routes/saves";
import fileRoutes from "./routes/files";
import storyRoutes from "./routes/stories";
import messageRoutes from "./routes/messages";
import reportRoutes from "./routes/reports";

import { Conversation } from "./models/Conversation";
import { Message } from "./models/Message";

const app = express();
const httpServer = createServer(app);
const PORT = parseInt(process.env.PORT || "3001");
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/snoutspace";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/saves", saveRoutes);
app.use("/api", fileRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reports", reportRoutes);

// ── Socket.io ─────────────────────────────────────────────────────────────────

const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, credentials: true },
});

io.use((socket, next) => {
  const rawCookie = socket.handshake.headers.cookie || "";
  const tokenMatch = rawCookie.match(/(?:^|;\s*)token=([^;]+)/);
  const token = tokenMatch?.[1];
  if (!token) return next(new Error("Unauthorized"));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    socket.data.userId = payload.userId;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const userId: string = socket.data.userId;
  socket.join(`user:${userId}`);

  socket.on("send_message", async ({ recipientId, body }: { recipientId: string; body: string }) => {
    if (!body?.trim() || !recipientId) return;

    let conv = await Conversation.findOne({
      participants: { $all: [userId, recipientId], $size: 2 },
    });
    if (!conv) {
      conv = await Conversation.create({ participants: [userId, recipientId] });
    }

    const message = await Message.create({ conversation: conv._id, sender: userId, body: body.trim() });
    conv.lastMessage = message._id as any;
    conv.updatedAt = new Date();
    await conv.save();

    const populated = await message.populate("sender", "name username imageUrl");

    const serialized = {
      id: (populated._id as any).toString(),
      body: populated.body,
      read: populated.read,
      createdAt: populated.createdAt,
      conversationId: conv._id.toString(),
      sender: {
        id: (populated.sender as any)._id?.toString(),
        name: (populated.sender as any).name,
        username: (populated.sender as any).username,
        imageUrl: (populated.sender as any).imageUrl,
      },
    };

    socket.emit("message_sent", serialized);
    io.to(`user:${recipientId}`).emit("message_received", serialized);
  });

  socket.on("mark_read", async ({ conversationId }: { conversationId: string }) => {
    await Message.updateMany({ conversation: conversationId, sender: { $ne: userId } }, { read: true });
    socket.emit("messages_read", { conversationId });
  });

  socket.on("disconnect", () => {});
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────

mongoose.connect(MONGODB_URI).then(() => {
  console.log("Connected to MongoDB");
  httpServer.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}).catch((err) => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});
