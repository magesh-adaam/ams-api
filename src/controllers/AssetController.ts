import { Request, Response } from "express";
import { AssetService } from "../services/AssetService";

export class AssetController {
  static async getAll(req: Request, res: Response) {
    try {
      const assets = await AssetService.getAll(req.query);
      res.json(assets);
    } catch (error: any) {
      console.error("Failed to retrieve assets:", error);
      res.status(500).json({ error: "Failed to retrieve assets", message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const asset = await AssetService.getById(req.params.id);
      res.json(asset);
    } catch (error: any) {
      console.error("Failed to retrieve asset:", error);
      const status = error.message === "Asset not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to retrieve asset" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const newAsset = await AssetService.create(req.body);
      res.status(201).json(newAsset);
    } catch (error: any) {
      console.error("Failed to create asset:", error);
      const isValidationError =
        error.message === "Missing required fields" ||
        error.message === "Asset serial number already in use" ||
        error.message.includes("not found");
      res.status(isValidationError ? 400 : 500).json({ error: error.message || "Failed to create asset" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const updated = await AssetService.update(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Failed to update asset:", error);
      const isValidationError =
        error.message === "Missing required fields" ||
        error.message === "Asset serial number already in use" ||
        error.message.includes("not found");
      const status = error.message === "Asset not found" ? 404 : (isValidationError ? 400 : 500);
      res.status(status).json({ error: error.message || "Failed to update asset" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await AssetService.delete(req.params.id);
      res.json({ message: "Asset deleted successfully" });
    } catch (error: any) {
      console.error("Failed to delete asset:", error);
      const status = error.message === "Asset not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to delete asset" });
    }
  }
}
