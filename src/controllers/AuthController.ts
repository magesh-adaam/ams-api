import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username/Email and password are required" });
      }

      const userRepo = AppDataSource.getRepository(User);

      // Fetch user, select password column explicitly (as it has select: false)
      const user = await userRepo.createQueryBuilder("user")
        .leftJoinAndSelect("user.roles", "role")
        .addSelect("user.password")
        .where("user.username = :cred OR user.email = :cred", { cred: username })
        .getOne();

      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Verify password
      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Check active clearance
      if (!user.isActive) {
        return res.status(403).json({ error: "User account is deactivated. Contact your administrator." });
      }

      // Generate JWT Token
      const jwtSecret = process.env.JWT_SECRET || "supersecretkeyreplaceinproduction";
      const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "15m";
      
      const roleNames = user.roles.map(r => r.name);
      
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: roleNames,
        },
        jwtSecret,
        { expiresIn: jwtExpiresIn as any }
      );

      // Return user profile and token
      const responseUser = { ...user };
      delete (responseUser as any).password;

      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          roles: roleNames,
        }
      });
    } catch (error: any) {
      console.error("Login Error:", error);
      res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
  }
}
