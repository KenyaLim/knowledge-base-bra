import { Router } from "express";
import multer from "multer";
import { requireSession } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/admin.js";
import {
  getAdminContent,
  getAdminNavigation,
  getContent,
  getNavigation,
  importAdminNavigation,
  removeAdminContent,
  removeAdminNavigation,
  saveAdminContent,
  saveAdminNavigation,
  uploadAdminFile,
} from "../controllers/cmsController.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

router.get("/content", requireSession, getContent);
router.get("/navigation", requireSession, getNavigation);
router.get("/admin/content", requireSession, requireAdmin, getAdminContent);
router.get("/admin/navigation", requireSession, requireAdmin, getAdminNavigation);
router.post("/admin/content", requireSession, requireAdmin, saveAdminContent);
router.delete("/admin/content", requireSession, requireAdmin, removeAdminContent);
router.post("/admin/navigation", requireSession, requireAdmin, saveAdminNavigation);
router.post("/admin/navigation/import", requireSession, requireAdmin, importAdminNavigation);
router.delete("/admin/navigation", requireSession, requireAdmin, removeAdminNavigation);
router.post("/admin/upload", requireSession, requireAdmin, upload.single("file"), uploadAdminFile);

export default router;
