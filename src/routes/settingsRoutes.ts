import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController";

const router = Router();

// In a real app, updateSettings should be protected by middleware checking for SUPER_ADMIN role
router.get("/", getSettings);
router.put("/", updateSettings);

export default router;
