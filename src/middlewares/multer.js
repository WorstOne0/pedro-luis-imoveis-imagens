import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = "public";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB — matches the limit the dropzone advertises
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    cb(null, UPLOAD_DIR);
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

export default multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE, files: 10 } });
