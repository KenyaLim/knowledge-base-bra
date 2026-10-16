import { Router } from "express";
import multer from "multer";
import { requireSession } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/admin.js";
import {
  getAdminContent,
  getContent,
  removeAdminContent,
  saveAdminContent,
  uploadAdminFile,
} from "../controllers/cmsController.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

router.get("/content", requireSession, getContent);
router.get("/admin/content", requireSession, requireAdmin, getAdminContent);
router.post("/admin/content", requireSession, requireAdmin, saveAdminContent);
router.delete("/admin/content", requireSession, requireAdmin, removeAdminContent);
router.post("/admin/upload", requireSession, requireAdmin, upload.single("file"), uploadAdminFile);

export default router;
