# pedro_luis_imoveis_images

Image upload/serving service for Pedro Luis Imóveis. Express 4 + multer, ESM.
The backend calls it server-to-server; browsers only ever fetch `/images/<file>`.

## Working agreements

**Do not commit unless I ask.** Leave changes in the working tree for review.

- Never print or commit `.env`.
- Verify uploads by actually posting a file, including a rejected one.

## Upload pipeline

multer streams to `public/tmp` → `process_upload` writes the finished file into
`public/` → the controller maps it to a url. Limits and targets live in
`src/config/upload.js`; change them there, not inline.

- **Images are resized, never rejected for being large.** Anything up to 60MB is
  re-encoded to fit 2560px on the long edge as WebP q82 — a 24MP camera photo
  lands around 500KB. `withoutEnlargement` keeps small images small.
- `.rotate()` must come before `.resize()`. Phone photos carry an EXIF
  orientation flag, and sharp drops metadata on write, so skipping it produces
  sideways images.
- Dropping metadata also strips GPS coordinates, which phone photos of a
  property do contain. Keep it that way.
- **Pass sharp a Buffer, not a path.** libvips holds the input file open, which
  leaves the temp file undeletable on Windows and leaks a copy per upload.
- Videos are stored untouched (no ffmpeg). `.mov` is accepted because iPhones
  record quicktime, but only mp4/webm play reliably outside Safari.
- `public/tmp` lives under `public` so the move into place is a same-device
  rename; `server.js` 404s any request for it. Stale files are swept on boot.

## Rules that matter here

- **Uploads live in a Docker volume** mounted at `/app/public`. Anything written
  outside it is lost on the next rebuild, and `public/` is in `.dockerignore` so
  existing files are never baked into the image.
- **Never build a filesystem path from user input.** `delete` takes a filename
  from the body; run it through `path.basename` *and* verify the resolved path
  stays inside `public/`. This was a live path traversal.
- **Use `path.basename`, not `split("\\")`.** The Windows separator returns the
  whole path on Linux, which is where this actually runs.
- Filenames need a random suffix, not just a timestamp — `uploadMany` writes a
  whole batch inside the same second and same-named files overwrote each other.
- multer rejections throw; the error handler in `server.js` turns them into JSON
  400s instead of Express' default HTML 500.
- Body-parser limits must be registered *before* the router or they never apply.

Accepted: jpeg, png, webp, avif, heic, heif, tiff (resized to WebP) and mp4,
webm, quicktime (stored as-is). 10 files per request; 60MB per image, 300MB per
video. `CLIENT_MAX_BODY_SIZE` on both this service and the backend must stay
above the video cap or nginx rejects the upload first.

## Environment

`PORT` `HOST` `ACCESS_TOKEN_JWT` — the JWT secret must match the backend's,
since it validates tokens the backend issued.
