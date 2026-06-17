import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import * as bcrypt from "bcryptjs";

export class UserService {
  private static getUserRepository() {
    return AppDataSource.getRepository(User);
  }

  private static getRoleRepository() {
    return AppDataSource.getRepository(Role);
  }

  static async getAll(filters: { search?: string; role?: string; status?: string }): Promise<User[]> {
    const userRepo = this.getUserRepository();
    const { search, role, status } = filters;

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

    return await queryBuilder.getMany();
  }

  static async getById(id: string): Promise<User> {
    const userRepo = this.getUserRepository();
    const user = await userRepo.findOne({
      where: { id },
    });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  static async create(userData: {
    username: string;
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    isActive?: boolean | string;
    roles?: string[];
  }): Promise<User> {
    const { username, email, password, firstName, lastName, isActive, roles } = userData;

    if (!username || !email || !password || !firstName || !lastName) {
      throw new Error("Missing required fields");
    }

    const userRepo = this.getUserRepository();

    // Check existing username/email
    const existingUser = await userRepo.findOne({
      where: [{ username }, { email }]
    });
    if (existingUser) {
      throw new Error("Username or Email already in use");
    }

    const roleRepo = this.getRoleRepository();
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

    return await userRepo.save(newUser);
  }

  static async update(
    id: string,
    userData: {
      username?: string;
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      isActive?: boolean | string;
      roles?: string[];
    }
  ): Promise<User> {
    const { username, email, password, firstName, lastName, isActive, roles } = userData;
    const userRepo = this.getUserRepository();

    const user = await userRepo.findOne({
      where: { id },
    });
    if (!user) {
      throw new Error("User not found");
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
      const roleRepo = this.getRoleRepository();
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

    return await userRepo.save(user);
  }

  static async delete(id: string): Promise<void> {
    const userRepo = this.getUserRepository();
    const user = await userRepo.findOne({
      where: { id },
    });
    if (!user) {
      throw new Error("User not found");
    }
    await userRepo.remove(user);
  }

  static async getRoles(): Promise<Role[]> {
    const roleRepo = this.getRoleRepository();
    return await roleRepo.find({ order: { name: "ASC" } });
  }
}
