import { Router } from "express";
import { PpmChecklistController } from "../controllers/PpmChecklistController";

const router = Router();

router.get("/", PpmChecklistController.getAll);
router.get("/:id", PpmChecklistController.getById);
router.post("/", PpmChecklistController.create);
router.put("/:id", PpmChecklistController.update);
router.delete("/:id", PpmChecklistController.delete);

export default router;
