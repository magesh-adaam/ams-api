import { Request, Response } from "express";
import { PpmChecklistService } from "../services/PpmChecklistService";

export class PpmChecklistController {
  static async getAll(req: Request, res: Response) {
    try {
      const checklists = await PpmChecklistService.getAll(req.query);
      res.json(checklists);
    } catch (error: any) {
      console.error("Failed to retrieve PPM checklists:", error);
      res.status(500).json({ error: "Failed to retrieve PPM checklists", message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const checklist = await PpmChecklistService.getById(req.params.id);
      res.json(checklist);
    } catch (error: any) {
      console.error("Failed to retrieve PPM checklist:", error);
      const status = error.message === "PPM Checklist not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to retrieve PPM checklist" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const newChecklist = await PpmChecklistService.create(req.body);
      res.status(201).json(newChecklist);
    } catch (error: any) {
      console.error("Failed to create PPM checklist:", error);
      const isValidationError =
        error.message === "Missing required fields" ||
        error.message.includes("not found");
      res.status(isValidationError ? 400 : 500).json({ error: error.message || "Failed to create PPM checklist" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const updated = await PpmChecklistService.update(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Failed to update PPM checklist:", error);
      const isValidationError =
        error.message === "Missing required fields" ||
        error.message.includes("not found");
      const status = error.message === "PPM Checklist not found" ? 404 : (isValidationError ? 400 : 500);
      res.status(status).json({ error: error.message || "Failed to update PPM checklist" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await PpmChecklistService.delete(req.params.id);
      res.json({ message: "PPM Checklist deleted successfully" });
    } catch (error: any) {
      console.error("Failed to delete PPM checklist:", error);
      const status = error.message === "PPM Checklist not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to delete PPM checklist" });
    }
  }
}
