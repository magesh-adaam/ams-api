import { Router } from "express";
import { UserLocationController } from "../controllers/UserLocationController";

const router = Router();

router.get("/", UserLocationController.getAll);
router.get("/:id", UserLocationController.getById);
router.post("/", UserLocationController.create);
router.put("/:id", UserLocationController.update);
router.delete("/:id", UserLocationController.delete);

export default router;
