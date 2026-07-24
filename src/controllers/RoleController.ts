import { Request, Response } from "express";
import { RoleService } from "../services/RoleService";

export class RoleController {
  static async getAll(req: Request, res: Response) {
    try {
      const roles = await RoleService.getAll();
      res.json(roles);
    } catch (error: any) {
      console.error("Failed to retrieve roles:", error);
      res.status(500).json({ error: "Failed to retrieve roles", message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const role = await RoleService.getById(req.params.id);
      res.json(role);
    } catch (error: any) {
      console.error("Failed to retrieve role:", error);
      const status = error.message === "Role not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to retrieve role" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const newRole = await RoleService.create(req.body);
      res.status(201).json(newRole);
    } catch (error: any) {
      console.error("Failed to create role:", error);
      const isValidationError = error.message === "Role name is required" || error.message === "Role name already in use";
      res.status(isValidationError ? 400 : 500).json({ error: error.message || "Failed to create role" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const updatedRole = await RoleService.update(req.params.id, req.body);
      res.json(updatedRole);
    } catch (error: any) {
      console.error("Failed to update role:", error);
      const status = error.message === "Role not found" ? 404 : 500;
      const isValidationError = error.message === "Cannot rename system roles" || error.message === "Role name already in use";
      res.status(isValidationError ? 400 : status).json({ error: error.message || "Failed to update role" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await RoleService.delete(req.params.id);
      res.json({ message: "Role deleted successfully" });
    } catch (error: any) {
      console.error("Failed to delete role:", error);
      const status = error.message === "Role not found" ? 404 : 500;
      const isForbidden = error.message === "System default roles cannot be deleted";
      res.status(isForbidden ? 403 : status).json({ error: error.message || "Failed to delete role" });
    }
  }

  static async getPermissions(req: Request, res: Response) {
    try {
      const permissions = await RoleService.getPermissions();
      res.json(permissions);
    } catch (error: any) {
      console.error("Failed to retrieve permissions:", error);
      res.status(500).json({ error: "Failed to retrieve permissions", message: error.message });
    }
  }
}
