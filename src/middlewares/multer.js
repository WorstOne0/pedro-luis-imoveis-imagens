import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import config from "../config/upload.js";

const ALLOWED_MIME = [...config.IMAGE_MIME, ...config.VIDEO_MIME];

// Streamed to a temp directory rather than held in memory: a 300MB video
// buffered in RAM would take the process down.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(config.TMP_DIR)) fs.mkdirSync(config.TMP_DIR, { recursive: true });

    cb(null, config.TMP_DIR);
  },
  filename: (req, file, cb) => {
    // A timestamp alone collides: uploadMany writes a whole batch within the
    // same second, so same-named files overwrote each other. Random suffix
    // makes each name unique.
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .toLowerCase();

    cb(null, `${base || "file"}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
  }

  return cb(null, true);
};

export default multer({
  storage,
  fileFilter,
  limits: { fileSize: config.MAX_UPLOAD, files: config.MAX_FILES },
});
