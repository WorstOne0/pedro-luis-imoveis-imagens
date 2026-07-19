# Pedro Luis Imóveis — Images

> Upload, resize and serve listing photos and video. Oversized images are
> re-encoded to fit, not rejected.

One of five repositories that make up the product:

| Repository | Role |
|---|---|
| frontend | Public site — map + listings |
| dashboard | Admin panel — listing CRUD, uploads, auth |
| backend | REST API |
| **images** (this one) | Upload, resize and serve photos/video |
| database | MongoDB container + backup scripts |

---

## Features

- **Automatic resizing** — images are re-encoded to fit within 2560×2560 as WebP
  at quality 82. A broker never has to think about file size, and a 30MB phone
  photo becomes a few hundred KB.
- **EXIF orientation handled** — rotation is applied before resizing, so
  portrait photos don't come out sideways. EXIF is stripped in the process,
  including GPS, which is what you want on a public listing site.
- **Video passthrough** — MP4 and MOV up to 300MB. `.mov` is accepted because
  iPhones record `video/quicktime` by default.
- **Safe deletes** — filenames are reduced to a basename and the resolved path is
  checked to be inside the upload directory.
- **Temp file hygiene** — the temp directory is swept on boot, and cleanup
  failures are logged rather than swallowed.

---

## Tech stack

Node.js · Express · multer · sharp

---

## Getting started

```bash
npm install
cp .env.example .env     # then fill it in
npm start                # http://localhost:3200
```

---

## Configuration

All limits live in `src/config/upload.js`, in one place because the multer
middleware, the processing step and the error messages all have to agree.

| Setting | Value |
|---|---|
| `MAX_UPLOAD` | 300MB — multer's single limit, so it must be the larger of the two |
| `IMAGE_MAX_UPLOAD` | 60MB |
| `VIDEO_MAX_UPLOAD` | 300MB |
| `IMAGE_MAX_DIMENSION` | 2560px |
| `IMAGE_QUALITY` | 82 (WebP) |
| `MAX_FILES` | 10 |

---

## Notes for anyone reading the code

**`.rotate()` must come before `.resize()`.** sharp drops the EXIF orientation
flag during resize, so rotating afterwards is too late.

**sharp is handed a Buffer, not a path.** libvips keeps the input file open when
given a path, which makes the temp file undeletable on Windows and leaked one
copy of every upload — a real ~30MB-per-batch leak, made invisible by a cleanup
helper that swallowed the `unlink` failure.

**Resizing only ever shrinks.** It cannot recover detail that was thrown away
before upload. Photos that arrive already WhatsApp-compressed at 1280×960 stay
that way — the fix for those is getting originals off the camera, not a code
change.

---

## Project structure

```
src/
  config/upload.js             limits and processing targets
  features/upload/
    controllers/  routes/
  middlewares/
    multer.js                  storage + limits
    process_upload.js          resize pipeline, temp cleanup
  server.js
public/                        served files; public/tmp is scratch
```

---

## Known limitations

- Video is passed through unprocessed — no transcoding, no thumbnail extraction.
- Files are stored on local disk. Moving to object storage would need changes
  here and in the urls the backend stores.
- No test suite. Verification is manual, by uploading real photos through the
  dashboard.

---

## Project status and contributions

This is a commissioned project built for a specific business. It is **not** an
open source project and is not accepting contributions, feature requests or
pull requests.

## Copyright and licence

**Copyright © 2026 Lucca Gabriel. All rights reserved.**

This repository is published so the source can be **read**, as a portfolio piece
and for reference. It is deliberately published **without a licence**, which
under default copyright law means all rights are reserved.

Viewing and forking within GitHub are permitted by GitHub's Terms of Service.
That does **not** grant permission to use, copy, modify, deploy or redistribute
this code. Third-party dependencies keep their own licences, and Pedro Luis
Imóveis brand assets are the property of their owner.

See [`COPYRIGHT.md`](COPYRIGHT.md) for the full terms.
