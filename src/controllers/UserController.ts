import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import * as bcrypt from "bcryptjs";

export class UserController {
  static async getAll(req: Request, res: Response) {
    try {
      const userRepo = AppDataSource.getRepository(User);
      const { search, role, status } = req.query;
      
      const queryBuilder = userRepo.createQueryBuilder("user")
        .leftJoinAndSelect("user.roles", "role");

      if (search) {
        queryBuilder.andWhere(
          "(user.username ILIKE :search OR user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      if (role && role !== "ALL") {
        queryBuilder.andWhere("role.name = :role", { role });
      }

      if (status && status !== "ALL") {
        const isActive = status === "ACTIVE" || status === "true";
        queryBuilder.andWhere("user.isActive = :isActive", { isActive });
      }

      queryBuilder.orderBy("user.createdAt", "DESC");

      const users = await queryBuilder.getMany();
      res.json(users);
    } catch (error: any) {
      console.error("Failed to retrieve users:", error);
      res.status(500).json({ error: "Failed to retrieve users", message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: req.params.id },
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      console.error("Failed to retrieve user:", error);
      res.status(500).json({ error: "Failed to retrieve user", message: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { username, email, password, firstName, lastName, isActive, roles } = req.body;

      if (!username || !email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const userRepo = AppDataSource.getRepository(User);
      
      // Check existing username/email
      const existingUser = await userRepo.findOne({
        where: [{ username }, { email }]
      });
      if (existingUser) {
        return res.status(400).json({ error: "Username or Email already in use" });
      }

      const roleRepo = AppDataSource.getRepository(Role);
      let assignedRoles: Role[] = [];
      if (roles && Array.isArray(roles) && roles.length > 0) {
        const uuids = roles.filter((r) =>
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(r)
        );
        const names = roles.filter((r) =>
          !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(r)
        );

        let query = roleRepo.createQueryBuilder("role");
        if (uuids.length > 0 && names.length > 0) {
          query = query.where("role.id IN (:...uuids) OR role.name IN (:...names)", { uuids, names });
        } else if (uuids.length > 0) {
          query = query.where("role.id IN (:...uuids)", { uuids });
        } else if (names.length > 0) {
          query = query.where("role.name IN (:...names)", { names });
        }

        const resolvedRoles = await query.getMany();
        assignedRoles = resolvedRoles;
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const newUser = userRepo.create({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isActive: isActive !== undefined ? (isActive === true || isActive === "true") : true,
        roles: assignedRoles,
      });

      await userRepo.save(newUser);
      
      // Omit password field from response
      const responseData = { ...newUser };
      delete (responseData as any).password;
      
      res.status(201).json(responseData);
    } catch (error: any) {
      console.error("Failed to create user:", error);
      res.status(500).json({ error: "Failed to create user", message: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { username, email, password, firstName, lastName, isActive, roles } = req.body;
      const userRepo = AppDataSource.getRepository(User);
      
      const user = await userRepo.findOne({
        where: { id: req.params.id },
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (username) user.username = username;
      if (email) user.email = email;
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (isActive !== undefined) {
        user.isActive = (isActive === true || isActive === "true");
      }

      if (password && password.trim() !== "") {
        user.password = bcrypt.hashSync(password, 10);
      }

      if (roles && Array.isArray(roles)) {
        const roleRepo = AppDataSource.getRepository(Role);
        if (roles.length > 0) {
          const uuids = roles.filter((r) =>
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(r)
          );
          const names = roles.filter((r) =>
            !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(r)
          );

          let query = roleRepo.createQueryBuilder("role");
          if (uuids.length > 0 && names.length > 0) {
            query = query.where("role.id IN (:...uuids) OR role.name IN (:...names)", { uuids, names });
          } else if (uuids.length > 0) {
            query = query.where("role.id IN (:...uuids)", { uuids });
          } else if (names.length > 0) {
            query = query.where("role.name IN (:...names)", { names });
          }

          const resolvedRoles = await query.getMany();
          user.roles = resolvedRoles;
        } else {
          user.roles = [];
        }
      }

      await userRepo.save(user);

      // Omit password
      const responseData = { ...user };
      delete (responseData as any).password;

      res.json(responseData);
    } catch (error: any) {
      console.error("Failed to update user:", error);
      res.status(500).json({ error: "Failed to update user", message: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: req.params.id },
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      await userRepo.remove(user);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      res.status(500).json({ error: "Failed to delete user", message: error.message });
    }
  }

  static async getRoles(req: Request, res: Response) {
    try {
      const roleRepo = AppDataSource.getRepository(Role);
      const roles = await roleRepo.find({ order: { name: "ASC" } });
      res.json(roles);
    } catch (error: any) {
      console.error("Failed to retrieve roles:", error);
      res.status(500).json({ error: "Failed to retrieve roles", message: error.message });
    }
  }
}
