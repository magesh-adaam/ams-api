import { Request, Response } from "express";
import { BlockService } from "../services/BlockService";

export class BlockController {
  static async getAll(req: Request, res: Response) {
    try {
      const blocks = await BlockService.getAll(req.query);
      res.json(blocks);
    } catch (error: any) {
      console.error("Failed to retrieve blocks:", error);
      res.status(500).json({ error: "Failed to retrieve blocks", message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const block = await BlockService.getById(req.params.id);
      res.json(block);
    } catch (error: any) {
      console.error("Failed to retrieve block:", error);
      const status = error.message === "Block not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to retrieve block" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const newBlock = await BlockService.create(req.body);
      res.status(201).json(newBlock);
    } catch (error: any) {
      console.error("Failed to create block:", error);
      const isValidationError = error.message === "Missing required fields" || error.message === "Block code already in use" || error.message === "Facility not found";
      res.status(isValidationError ? 400 : 500).json({ error: error.message || "Failed to create block" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const updatedBlock = await BlockService.update(req.params.id, req.body);
      res.json(updatedBlock);
    } catch (error: any) {
      console.error("Failed to update block:", error);
      const status = error.message === "Block not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to update block" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await BlockService.delete(req.params.id);
      res.json({ message: "Block deleted successfully" });
    } catch (error: any) {
      console.error("Failed to delete block:", error);
      const status = error.message === "Block not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to delete block" });
    }
  }
}
