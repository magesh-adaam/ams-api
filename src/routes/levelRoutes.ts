import { Router } from "express";
import { LevelController } from "../controllers/LevelController";

const router = Router();

router.get("/", LevelController.getAll);
router.get("/:id", LevelController.getById);
router.post("/", LevelController.create);
router.put("/:id", LevelController.update);
router.delete("/:id", LevelController.delete);

export default router;
