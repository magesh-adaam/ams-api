import { Request, Response } from "express";
import { FacilityService } from "../services/FacilityService";

export class FacilityController {
  static async getAll(req: Request, res: Response) {
    try {
      const facilities = await FacilityService.getAll(req.query);
      res.json(facilities);
    } catch (error: any) {
      console.error("Failed to retrieve facilities:", error);
      res.status(500).json({ error: "Failed to retrieve facilities", message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const facility = await FacilityService.getById(req.params.id);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }
      res.json(facility);
    } catch (error: any) {
      console.error("Failed to retrieve facility:", error);
      res.status(500).json({ error: "Failed to retrieve facility", message: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const newFacility = await FacilityService.create(req.body);
      res.status(201).json(newFacility);
    } catch (error: any) {
      console.error("Failed to create facility:", error);
      const isValidationError =
        error.message === "Facility Name is required" ||
        error.message === "Facility name already in use" ||
        error.message === "Facility code already in use";
      res.status(isValidationError ? 400 : 500).json({ error: error.message || "Failed to create facility" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const updatedFacility = await FacilityService.update(req.params.id, req.body);
      res.json(updatedFacility);
    } catch (error: any) {
      console.error("Failed to update facility:", error);
      const isNotFound = error.message === "Facility not found";
      const isValidationError =
        error.message === "Facility name already in use" ||
        error.message === "Facility code already in use";
      
      const status = isNotFound ? 404 : (isValidationError ? 400 : 500);
      res.status(status).json({ error: error.message || "Failed to update facility" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await FacilityService.delete(req.params.id);
      res.json({ message: "Facility deleted successfully" });
    } catch (error: any) {
      console.error("Failed to delete facility:", error);
      const status = error.message === "Facility not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to delete facility" });
    }
  }
}
