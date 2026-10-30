import { Router } from "express";
import { login, logout, session } from "../controllers/authController.js";

import { setupPassword } from "../controllers/passwordController.js";

const router = Router();
router.post("/password-setup", setupPassword);

router.post("/login", login);
router.post("/logout", logout);
router.get("/session", session);

export default router;
