import { Request, Response } from "express";
import { UserLocationService } from "../services/UserLocationService";

export class UserLocationController {
  static async getAll(req: Request, res: Response) {
    try {
      const userLocations = await UserLocationService.getAll(req.query);
      res.json(userLocations);
    } catch (error: any) {
      console.error("Failed to retrieve user locations:", error);
      res.status(550).json({ error: "Failed to retrieve user locations", message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const userLocation = await UserLocationService.getById(req.params.id);
      res.json(userLocation);
    } catch (error: any) {
      console.error("Failed to retrieve user location:", error);
      const status = error.message === "User location mapping not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to retrieve user location" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const newUserLocation = await UserLocationService.create(req.body);
      res.status(201).json(newUserLocation);
    } catch (error: any) {
      console.error("Failed to create user location:", error);
      const isValidationError =
        error.message === "Missing required fields" ||
        error.message.includes("not found") ||
        error.message.includes("already assigned");
      res.status(isValidationError ? 400 : 500).json({ error: error.message || "Failed to create user location" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const updatedUserLocation = await UserLocationService.update(req.params.id, req.body);
      res.json(updatedUserLocation);
    } catch (error: any) {
      console.error("Failed to update user location:", error);
      const status = error.message === "User location mapping not found" ? 404 : (error.message.includes("already assigned") ? 400 : 500);
      res.status(status).json({ error: error.message || "Failed to update user location" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await UserLocationService.delete(req.params.id);
      res.json({ message: "User location mapping deleted successfully" });
    } catch (error: any) {
      console.error("Failed to delete user location:", error);
      const status = error.message === "User location mapping not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to delete user location" });
    }
  }
}
