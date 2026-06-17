import { Request, Response } from "express";
import { UserService } from "../services/UserService";

export class UserController {
  static async getAll(req: Request, res: Response) {
    try {
      const users = await UserService.getAll(req.query);
      res.json(users);
    } catch (error: any) {
      console.error("Failed to retrieve users:", error);
      res.status(500).json({ error: "Failed to retrieve users", message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const user = await UserService.getById(req.params.id);
      res.json(user);
    } catch (error: any) {
      console.error("Failed to retrieve user:", error);
      const status = error.message === "User not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to retrieve user" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const newUser = await UserService.create(req.body);
      
      // Omit password field from response
      const responseData = { ...newUser };
      delete (responseData as any).password;
      
      res.status(201).json(responseData);
    } catch (error: any) {
      console.error("Failed to create user:", error);
      const isValidationError = error.message === "Missing required fields" || error.message === "Username or Email already in use";
      res.status(isValidationError ? 400 : 500).json({ error: error.message || "Failed to create user" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const updatedUser = await UserService.update(req.params.id, req.body);

      // Omit password
      const responseData = { ...updatedUser };
      delete (responseData as any).password;

      res.json(responseData);
    } catch (error: any) {
      console.error("Failed to update user:", error);
      const status = error.message === "User not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to update user" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await UserService.delete(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      const status = error.message === "User not found" ? 404 : 500;
      res.status(status).json({ error: error.message || "Failed to delete user" });
    }
  }

  static async getRoles(req: Request, res: Response) {
    try {
      const roles = await UserService.getRoles();
      res.json(roles);
    } catch (error: any) {
      console.error("Failed to retrieve roles:", error);
      res.status(500).json({ error: "Failed to retrieve roles", message: error.message });
    }
  }
}
