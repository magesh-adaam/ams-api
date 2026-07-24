import { Request, Response } from "express";
import { LevelService } from "../services/LevelService";

export class LevelController {
  static async getAll(req: Request, res: Response) {
    try {
      const levels = await LevelService.getAll(req.query);
      res.json(levels);
    } catch (error: any) {
      console.error("Failed to retrieve levels:", error);
      res.status(500).json({ error: "Failed to retrieve levels", message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const level = await LevelService.getById(req.params.id);
      res.json(level);
    } catch (error: any) {
      console.error("Failed to retrieve level:", error);
      const status = error.message === "Level not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to retrieve level" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const newLevel = await LevelService.create(req.body);
      res.status(201).json(newLevel);
    } catch (error: any) {
      console.error("Failed to create level:", error);
      const isValidationError =
        error.message === "Missing required fields" ||
        error.message === "Level code already in use" ||
        error.message === "Block not found";
      res.status(isValidationError ? 400 : 500).json({ error: error.message || "Failed to create level" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const updatedLevel = await LevelService.update(req.params.id, req.body);
      res.json(updatedLevel);
    } catch (error: any) {
      console.error("Failed to update level:", error);
      const status = error.message === "Level not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to update level" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await LevelService.delete(req.params.id);
      res.json({ message: "Level deleted successfully" });
    } catch (error: any) {
      console.error("Failed to delete level:", error);
      const status = error.message === "Level not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to delete level" });
    }
  }
}
