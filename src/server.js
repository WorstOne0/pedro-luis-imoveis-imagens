// .env config
import dotenv from "dotenv";
dotenv.config();

// NPM Packages
import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
// Routes
import router from "./routes/index.js";
import config from "./config/upload.js";
import { clearTempDir } from "./middlewares/process_upload.js";

// Create Server
const app = express();
console.log("Creating Image Server...");

app.use(cors());

// Server Config
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(router);

const __dirname = path.resolve();

// public/tmp holds half-written uploads mid-processing; it lives under public so
// the move into place is a same-device rename, but it must never be served.
app.use("/images", (req, res, next) => {
  if (req.path.startsWith("/tmp/")) return res.status(404).json({ status: 404, message: "Arquivo não encontrado" });

  return next();
});
app.use("/images", express.static(path.join(__dirname, "public")));

// Multer rejects oversized/unsupported files by throwing; without this the
// client gets Express' default HTML 500 instead of a usable message.
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: `Arquivo maior que ${Math.round(config.MAX_UPLOAD / 1024 / 1024)}MB`,
      LIMIT_FILE_COUNT: `Máximo de ${config.MAX_FILES} arquivos por envio`,
      LIMIT_UNEXPECTED_FILE: "Formato de arquivo não suportado",
    };

    return res.status(400).json({ status: 400, message: messages[error.code] ?? "Arquivo inválido" });
  }

  console.log("Error - server.js", error);
  return res.status(500).json({ status: 500, message: "Erro interno" });
});

// Start Server
app.listen(process.env.PORT, async () => {
  await clearTempDir();
  console.log(`Server Started on port ${process.env.PORT}`);
});
