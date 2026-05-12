import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import mongoose from "mongoose";

import authRoutes from "./routes/auth";
import postRoutes from "./routes/posts";
import userRoutes from "./routes/users";
import saveRoutes from "./routes/saves";
import fileRoutes from "./routes/files";

const app = express();
const PORT = parseInt(process.env.PORT || "3001");
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/snoutspace";

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/saves", saveRoutes);
app.use("/api", fileRoutes);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
