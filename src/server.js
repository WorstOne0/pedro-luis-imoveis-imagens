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

// Create Server
const app = express();
console.log("Creating Image Server...");

app.use(cors());

// Server Config
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(router);

const __dirname = path.resolve();
app.use("/images", express.static(path.join(__dirname, "public")));

// Multer rejects oversized/unsupported files by throwing; without this the
// client gets Express' default HTML 500 instead of a usable message.
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "Arquivo maior que 10MB" : "Arquivo inválido ou não suportado";

    return res.status(400).json({ status: 400, message });
  }

  console.log("Error - server.js", error);
  return res.status(500).json({ status: 500, message: "Erro interno" });
});

// Start Server
app.listen(process.env.PORT, () => {
  console.log(`Server Started on port ${process.env.PORT}`);
});
