import { AppDataSource } from "../config/data-source";
import { Role } from "../entities/Role";
import { Permission } from "../entities/Permission";

export class RoleService {
  private static getRoleRepository() {
    return AppDataSource.getRepository(Role);
  }

  private static getPermissionRepository() {
    return AppDataSource.getRepository(Permission);
  }

  static async getAll(): Promise<Role[]> {
    const roleRepo = this.getRoleRepository();
    return await roleRepo.find({
      order: { name: "ASC" },
      relations: { permissions: true }
    });
  }

  static async getById(id: string): Promise<Role> {
    const roleRepo = this.getRoleRepository();
    const role = await roleRepo.findOne({
      where: { id },
      relations: { permissions: true },
    });
    if (!role) {
      throw new Error("Role not found");
    }
    return role;
  }

  static async create(roleData: {
    name: string;
    description?: string;
    permissions?: string[];
  }): Promise<Role> {
    const { name, description, permissions } = roleData;

    if (!name) {
      throw new Error("Role name is required");
    }

    const roleRepo = this.getRoleRepository();

    // Check duplicate name
    const uppercaseName = name.trim().toUpperCase();
    const existingRole = await roleRepo.findOneBy({ name: uppercaseName });
    if (existingRole) {
      throw new Error("Role name already in use");
    }

    // Resolve permissions
    let assignedPermissions: Permission[] = [];
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      const permissionRepo = this.getPermissionRepository();
      const uuids = permissions.filter((p) =>
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(p)
      );
      const names = permissions.filter((p) =>
        !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(p)
      );

      let query = permissionRepo.createQueryBuilder("permission");
      if (uuids.length > 0 && names.length > 0) {
        query = query.where("permission.id IN (:...uuids) OR permission.name IN (:...names)", { uuids, names });
      } else if (uuids.length > 0) {
        query = query.where("permission.id IN (:...uuids)", { uuids });
      } else if (names.length > 0) {
        query = query.where("permission.name IN (:...names)", { names });
      }

      assignedPermissions = await query.getMany();
    }

    const newRole = roleRepo.create({
      name: uppercaseName,
      description,
      permissions: assignedPermissions,
    });

    return await roleRepo.save(newRole);
  }

  static async update(
    id: string,
    roleData: {
      name?: string;
      description?: string;
      permissions?: string[];
    }
  ): Promise<Role> {
    const { name, description, permissions } = roleData;
    const roleRepo = this.getRoleRepository();

    const role = await roleRepo.findOne({
      where: { id },
      relations: { permissions: true },
    });
    if (!role) {
      throw new Error("Role not found");
    }

    // Prevent changing/deleting default critical roles to avoid breaking user access, but allow customization if needed
    if (role.name === "SUPER_ADMIN" || role.name === "ADMIN") {
      // Just double-check, but we can allow descriptions to be updated
    }

    if (name) {
      const uppercaseName = name.trim().toUpperCase();
      if (uppercaseName !== role.name) {
        // Prevent renaming SUPER_ADMIN or ADMIN
        if (role.name === "SUPER_ADMIN" || role.name === "ADMIN") {
          throw new Error("Cannot rename system roles");
        }
        const existingRole = await roleRepo.findOneBy({ name: uppercaseName });
        if (existingRole) {
          throw new Error("Role name already in use");
        }
        role.name = uppercaseName;
      }
    }

    if (description !== undefined) {
      role.description = description;
    }

    if (permissions && Array.isArray(permissions)) {
      const permissionRepo = this.getPermissionRepository();
      if (permissions.length > 0) {
        const uuids = permissions.filter((p) =>
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(p)
        );
        const names = permissions.filter((p) =>
          !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(p)
        );

        let query = permissionRepo.createQueryBuilder("permission");
        if (uuids.length > 0 && names.length > 0) {
          query = query.where("permission.id IN (:...uuids) OR permission.name IN (:...names)", { uuids, names });
        } else if (uuids.length > 0) {
          query = query.where("permission.id IN (:...uuids)", { uuids });
        } else if (names.length > 0) {
          query = query.where("permission.name IN (:...names)", { names });
        }

        const resolvedPermissions = await query.getMany();
        role.permissions = resolvedPermissions;
      } else {
        role.permissions = [];
      }
    }

    return await roleRepo.save(role);
  }

  static async delete(id: string): Promise<void> {
    const roleRepo = this.getRoleRepository();
    const role = await roleRepo.findOneBy({ id });
    if (!role) {
      throw new Error("Role not found");
    }

    if (role.name === "SUPER_ADMIN") {
      throw new Error("System default roles cannot be deleted");
    }

    await roleRepo.remove(role);
  }

  static async getPermissions(): Promise<Permission[]> {
    const permissionRepo = this.getPermissionRepository();
    return await permissionRepo.find({ order: { name: "ASC" } });
  }
}
