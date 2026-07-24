import { Request, Response } from "express";
import { AssetClassificationService } from "../services/AssetClassificationService";

export class AssetClassificationController {
  static async getAll(req: Request, res: Response) {
    try {
      const classifications = await AssetClassificationService.getAll(req.query);
      res.json(classifications);
    } catch (error: any) {
      console.error("Failed to retrieve asset classifications:", error);
      res.status(500).json({ error: "Failed to retrieve asset classifications", message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const classification = await AssetClassificationService.getById(req.params.id);
      res.json(classification);
    } catch (error: any) {
      console.error("Failed to retrieve asset classification:", error);
      const status = error.message === "Asset classification not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to retrieve asset classification" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const newClassification = await AssetClassificationService.create(req.body);
      res.status(201).json(newClassification);
    } catch (error: any) {
      console.error("Failed to create asset classification:", error);
      const isValidationError =
        error.message === "Missing required fields" ||
        error.message === "Classification code already in use";
      res.status(isValidationError ? 400 : 500).json({ error: error.message || "Failed to create asset classification" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const updated = await AssetClassificationService.update(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Failed to update asset classification:", error);
      const status = error.message === "Asset classification not found" ? 404 : (error.message === "Classification code already in use" ? 400 : 500);
      res.status(status).json({ error: error.message || "Failed to update asset classification" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await AssetClassificationService.delete(req.params.id);
      res.json({ message: "Asset classification deleted successfully" });
    } catch (error: any) {
      console.error("Failed to delete asset classification:", error);
      const status = error.message === "Asset classification not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to delete asset classification" });
    }
  }
}
