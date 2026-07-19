// NPM Packages
import express from "express";
import { verifyToken, multer, processUpload } from "../../../middlewares/index.js";
// Controller
import uploadController from "../controllers/upload_controller.js";
import config from "../../../config/upload.js";

const router = express.Router();

// multer writes to a temp dir, processUpload resizes/moves into public/.
router.post("/upload/single", verifyToken, multer.single("file"), processUpload, uploadController.uploadSingle);
router.post("/upload/many", verifyToken, multer.array("files", config.MAX_FILES), processUpload, uploadController.uploadMany);
router.post("/upload/delete", verifyToken, uploadController.delete);

export default router;
