import { Router } from "express";
import { BlockController } from "../controllers/BlockController";

const router = Router();

router.get("/", BlockController.getAll);
router.get("/:id", BlockController.getById);
router.post("/", BlockController.create);
router.put("/:id", BlockController.update);
router.delete("/:id", BlockController.delete);

export default router;
