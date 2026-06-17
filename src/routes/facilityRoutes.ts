import { Router } from "express";
import { FacilityController } from "../controllers/FacilityController";

const router = Router();

router.get("/", FacilityController.getAll);
router.get("/:id", FacilityController.getById);
router.post("/", FacilityController.create);
router.put("/:id", FacilityController.update);
router.delete("/:id", FacilityController.delete);

export default router;
