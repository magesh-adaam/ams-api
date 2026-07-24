import { Request, Response } from "express";
import { AssetTypeService } from "../services/AssetTypeService";

export class AssetTypeController {
  static async getAll(req: Request, res: Response) {
    try {
      const assetTypes = await AssetTypeService.getAll(req.query);
      res.json(assetTypes);
    } catch (error: any) {
      console.error("Failed to retrieve asset types:", error);
      res.status(500).json({ error: "Failed to retrieve asset types", message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const assetType = await AssetTypeService.getById(req.params.id);
      res.json(assetType);
    } catch (error: any) {
      console.error("Failed to retrieve asset type:", error);
      const status = error.message === "Asset type not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to retrieve asset type" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const newAssetType = await AssetTypeService.create(req.body);
      res.status(201).json(newAssetType);
    } catch (error: any) {
      console.error("Failed to create asset type:", error);
      const isValidationError =
        error.message === "Missing required fields" ||
        error.message === "Asset type code already in use" ||
        error.message.includes("not found");
      res.status(isValidationError ? 400 : 500).json({ error: error.message || "Failed to create asset type" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const updated = await AssetTypeService.update(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Failed to update asset type:", error);
      const isValidationError =
        error.message === "Missing required fields" ||
        error.message === "Asset type code already in use" ||
        error.message.includes("not found");
      const status = error.message === "Asset type not found" ? 404 : (isValidationError ? 400 : 500);
      res.status(status).json({ error: error.message || "Failed to update asset type" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await AssetTypeService.delete(req.params.id);
      res.json({ message: "Asset type deleted successfully" });
    } catch (error: any) {
      console.error("Failed to delete asset type:", error);
      const status = error.message === "Asset type not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to delete asset type" });
    }
  }
}
