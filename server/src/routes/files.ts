import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

router.post("/upload", requireAuth, upload.single("file"), (req: AuthRequest, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ message: "No file uploaded" });
    return;
  }
  const fileId = req.file.filename;
  const url = `${process.env.SERVER_URL || "http://localhost:3001"}/uploads/${fileId}`;
  res.json({ id: fileId, url });
});

router.delete("/files/:fileId", requireAuth, (req: AuthRequest, res: Response): void => {
  const filePath = path.join(UPLOADS_DIR, req.params.fileId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  res.json({ status: "ok" });
});

export default router;
