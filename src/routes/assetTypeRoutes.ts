import { Router } from "express";
import { AssetTypeController } from "../controllers/AssetTypeController";

const router = Router();

router.get("/", AssetTypeController.getAll);
router.get("/:id", AssetTypeController.getById);
router.post("/", AssetTypeController.create);
router.put("/:id", AssetTypeController.update);
router.delete("/:id", AssetTypeController.delete);

export default router;
