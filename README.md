# pedro_luis_imoveis_images

> Microservice for image storage, upload, and delivery — built for the Pedro Luis Imóveis real estate platform.

---

## Features

- Upload a single image or up to 10 images in one request
- Delete images by filename
- Serve images as static files via a public URL
- Query total storage usage (bytes)
- JWT-based authentication on all write endpoints
- CORS enabled for cross-origin clients
- Dockerized for easy deployment behind a reverse proxy

---

## Preview

Images uploaded are stored in `public/` and served at:

```
GET /images/:filename
```

File names are automatically timestamped on upload to avoid collisions (e.g., `photo_1762126531.jpg`).

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Runtime     | Node.js 21 (ESM)                  |
| Framework   | Express 5                         |
| Auth        | JSON Web Tokens (`jsonwebtoken`)  |
| File Upload | Multer 2                          |
| Date util   | Moment.js                         |
| Container   | Docker + Docker Compose           |
| Proxy       | nginx-proxy (via `VIRTUAL_HOST`)  |

---

## Project Structure

```
pedro_luis_imoveis_images/
├── src/
│   ├── server.js                        # Entry point — Express app setup
│   ├── routes/
│   │   ├── index.js                     # Aggregates all routes
│   │   └── version.js                   # GET /version (health check)
│   ├── middlewares/
│   │   ├── jwt.js                       # verifyToken / createToken
│   │   └── multer.js                    # Disk storage config (timestamped filenames)
│   └── features/
│       ├── upload/
│       │   ├── routes/upload_route.js   # POST /upload/*
│       │   └── controllers/upload_controller.js
│       └── information/
│           ├── routes/information_route.js  # GET /stats
│           └── controllers/information_controller.js
├── public/                              # Static image files served here
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## Installation

**Prerequisites:** Node.js 18+ or Docker

### Local

```bash
npm install
```

Create a `.env` file:

```env
PORT=3000
HOST=http://localhost:3000
ACCESS_TOKEN_JWT=your_secret_key
```

### Docker

```bash
docker compose up --build
```

The service picks up `PORT`, `HOST`, and `VIRTUAL_HOST` from your environment or a `.env` file.

---

## Usage

### Start (development)

```bash
npm run dev
```

### Start (production)

```bash
npm start
```

---

## API

All endpoints except `GET /version` and `GET /images/:filename` require a Bearer token:

```
Authorization: Bearer <token>
```

### Health Check

```
GET /version
```

Returns service name and version. No auth required.

---

### Upload Single Image

```
POST /upload/single
Content-Type: multipart/form-data
field: file
```

**Response:**
```json
{
  "status": 200,
  "payload": {
    "path": "http://your-host/images/photo_1762126531.jpg",
    "size": 204800
  },
  "message": "Ok!"
}
```

---

### Upload Multiple Images

```
POST /upload/many
Content-Type: multipart/form-data
field: files (up to 10 files)
```

**Response:**
```json
{
  "status": 200,
  "payload": [
    { "path": "http://your-host/images/img1_1762126531.jpg", "size": 102400 },
    { "path": "http://your-host/images/img2_1762126531.jpg", "size": 98304 }
  ],
  "message": "Ok"
}
```

---

### Delete Image

```
POST /upload/delete
Content-Type: application/json

{ "filename": "photo_1762126531.jpg" }
```

---

### Storage Stats

```
GET /stats
```

**Response:**
```json
{
  "status": 200,
  "payload": 5242880,
  "message": "Size in bytes"
}
```

---

### Serve Image

```
GET /images/:filename
```

No authentication required. Served directly from the `public/` folder.

---

## Roadmap

- [ ] Image resizing / thumbnail generation on upload
- [ ] Per-user storage quotas
- [ ] Soft delete (move to trash instead of `fs.rmSync`)
- [ ] Support for S3 / object storage backend
- [ ] Rate limiting on upload endpoints

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push and open a Pull Request

---

## License

MIT

---

**Short description (for GitHub):** Lightweight Express microservice for image upload, storage, and delivery with JWT auth — built for the Pedro Luis Imóveis platform.

**Suggested GitHub tags:** `nodejs` `express` `image-upload` `microservice` `multer` `jwt` `docker` `rest-api` `real-estate`
