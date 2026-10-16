import { Router } from "express";
import { login, logout, session } from "../controllers/authController.js";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/session", session);

export default router;
