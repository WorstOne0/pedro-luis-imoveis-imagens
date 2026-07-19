import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import config from "../config/upload.js";

const isImage = (file) => config.IMAGE_MIME.includes(file.mimetype);

/**
 * Clear anything left in the temp directory.
 *
 * A crash or restart mid-upload strands the partial file, and nothing else
 * would ever remove it. Called once on boot.
 */
export const clearTempDir = async () => {
  try {
    const entries = await fs.readdir(config.TMP_DIR);
    await Promise.all(entries.map((entry) => fs.unlink(path.join(config.TMP_DIR, entry)).catch(() => {})));

    if (entries.length > 0) console.log(`Cleared ${entries.length} stale upload(s) from ${config.TMP_DIR}`);
  } catch {
    // Directory does not exist yet — multer creates it on first upload.
  }
};

const removeTemp = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // ENOENT is expected: processVideo renames its file away before we get
    // here. Anything else means a temp file leaked, which is worth knowing
    // about — silently swallowing it hid 30MB of garbage per upload batch.
    if (error.code === "ENOENT") return;

    console.log("Warning - process_upload.js - could not remove temp file", filePath, error.code);
  }
};

/**
 * Re-encode an image to fit the configured bounds and return the stored file.
 *
 * Oversized photos are downscaled rather than rejected: the broker uploads
 * whatever the camera produced and the service makes it web-sized.
 */
const processImage = async (file) => {
  const target = path.join(config.UPLOAD_DIR, `${path.basename(file.filename, path.extname(file.filename))}.webp`);

  // Read into a buffer rather than handing sharp the path: libvips keeps the
  // input file open, which makes the temp file undeletable on Windows and
  // leaked one copy of every upload. Images are capped at IMAGE_MAX_UPLOAD and
  // processed one at a time, so this is bounded.
  const input = await fs.readFile(file.path);

  await sharp(input, {
    // Guard against decompression bombs: a small file can declare enormous
    // dimensions and exhaust memory on decode.
    limitInputPixels: 100_000_000,
  })
    // Must come before the resize. Phone photos carry an EXIF orientation flag;
    // without applying it here the output is rotated, because sharp drops
    // metadata (including that flag) on write.
    .rotate()
    .resize({
      width: config.IMAGE_MAX_DIMENSION,
      height: config.IMAGE_MAX_DIMENSION,
      fit: "inside",
      // Never upscale — a small image stays small instead of being blown up
      // into a soft, larger file.
      withoutEnlargement: true,
    })
    .webp({ quality: config.IMAGE_QUALITY })
    .toFile(target);

  const { size } = await fs.stat(target);

  return { filename: path.basename(target), size };
};

/** Videos are stored untouched; only the container is moved into place. */
const processVideo = async (file) => {
  const target = path.join(config.UPLOAD_DIR, file.filename);

  try {
    await fs.rename(file.path, target);
  } catch (error) {
    // rename fails across devices (tmp on a different mount); fall back to copy.
    if (error.code !== "EXDEV") throw error;

    await fs.copyFile(file.path, target);
  }

  return { filename: file.filename, size: file.size };
};

/**
 * Turns whatever multer wrote into the temp directory into finished files in
 * the public directory, and hangs the results on req.processedFiles.
 *
 * Runs after multer, before the controller.
 */
export default async (req, res, next) => {
  const files = [...(req.files ?? []), ...(req.file ? [req.file] : [])];
  if (files.length === 0) return next();

  try {
    const processed = [];

    for (const file of files) {
      if (isImage(file)) {
        if (file.size > config.IMAGE_MAX_UPLOAD) {
          throw Object.assign(new Error("Imagem muito grande"), { status: 400 });
        }

        processed.push(await processImage(file));
        continue;
      }

      if (file.size > config.VIDEO_MAX_UPLOAD) {
        throw Object.assign(new Error("Vídeo muito grande"), { status: 400 });
      }

      processed.push(await processVideo(file));
    }

    req.processedFiles = processed;

    return next();
  } catch (error) {
    console.log("Error - process_upload.js", error);

    const status = error.status ?? 500;
    const message = status === 400 ? error.message : "Não foi possível processar o arquivo enviado";

    return res.status(status).json({ status, message });
  } finally {
    // The temp copies are never needed again, including on failure.
    await Promise.all(files.map((file) => removeTemp(file.path)));
  }
};
