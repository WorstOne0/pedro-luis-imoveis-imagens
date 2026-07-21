const MB = 1024 * 1024;

/**
 * Upload limits and processing targets, in one place because the multer
 * middleware, the processing step and the error messages all have to agree.
 */
export default {
  // Where multer streams the raw upload before processing. Files here are
  // temporary and always removed, whether processing succeeds or fails.
  TMP_DIR: "public/tmp",
  UPLOAD_DIR: "public",

  // Multer applies one size limit to every file, so this has to be the larger
  // of the two. Images are checked against IMAGE_MAX_UPLOAD separately once we
  // know the mime type.
  MAX_UPLOAD: 300 * MB,

  // Generous: a 50MP phone photo can be 30MB before processing. Anything over
  // this is almost certainly not a listing photo.
  IMAGE_MAX_UPLOAD: 60 * MB,
  VIDEO_MAX_UPLOAD: 300 * MB,

  // Images are re-encoded to fit these bounds rather than rejected, so the
  // broker never has to think about file size.
  IMAGE_MAX_DIMENSION: 2560,
  IMAGE_QUALITY: 82,

  // A listing routinely has 20+ photos — every room, plus the facade and the
  // yard. Ten rejected real uploads. Must stay in step with the gallery
  // maxCount in the backend's real_estate route.
  MAX_FILES: 30,

  // .mov is here because iPhones record video/quicktime by default. It is
  // stored as-is, but browser playback is inconsistent outside Safari — mp4
  // and webm are the safe formats to publish.
  IMAGE_MIME: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif", "image/tiff"],
  VIDEO_MIME: ["video/mp4", "video/webm", "video/quicktime"],
};
