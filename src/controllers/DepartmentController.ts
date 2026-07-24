import { Request, Response } from "express";
import { DepartmentService } from "../services/DepartmentService";

export class DepartmentController {
  static async getAll(req: Request, res: Response) {
    try {
      const departments = await DepartmentService.getAll(req.query);
      res.json(departments);
    } catch (error: any) {
      console.error("Failed to retrieve departments:", error);
      res.status(500).json({ error: "Failed to retrieve departments", message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const department = await DepartmentService.getById(req.params.id);
      res.json(department);
    } catch (error: any) {
      console.error("Failed to retrieve department:", error);
      const status = error.message === "Department not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to retrieve department" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const newDept = await DepartmentService.create(req.body);
      res.status(201).json(newDept);
    } catch (error: any) {
      console.error("Failed to create department:", error);
      const isValidationError =
        error.message === "Missing required fields" ||
        error.message === "Department code already in use" ||
        error.message === "Level not found";
      res.status(isValidationError ? 400 : 500).json({ error: error.message || "Failed to create department" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const updatedDept = await DepartmentService.update(req.params.id, req.body);
      res.json(updatedDept);
    } catch (error: any) {
      console.error("Failed to update department:", error);
      const status = error.message === "Department not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to update department" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await DepartmentService.delete(req.params.id);
      res.json({ message: "Department deleted successfully" });
    } catch (error: any) {
      console.error("Failed to delete department:", error);
      const status = error.message === "Department not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to delete department" });
    }
  }
}
