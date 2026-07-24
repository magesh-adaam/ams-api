import { Router } from "express";
import { AssetClassificationController } from "../controllers/AssetClassificationController";

const router = Router();

router.get("/", AssetClassificationController.getAll);
router.get("/:id", AssetClassificationController.getById);
router.post("/", AssetClassificationController.create);
router.put("/:id", AssetClassificationController.update);
router.delete("/:id", AssetClassificationController.delete);

export default router;
