import { AppDataSource } from "../config/data-source";
import { Role } from "../entities/Role";
import { Permission } from "../entities/Permission";
import { User } from "../entities/User";
import * as bcrypt from "bcryptjs";

export async function seedDatabase() {
  const roleRepo = AppDataSource.getRepository(Role);
  const permissionRepo = AppDataSource.getRepository(Permission);
  const userRepo = AppDataSource.getRepository(User);

  // 1. Seed Permissions
  const permissionsToSeed = [
    { name: "asset.create", description: "Create assets" },
    { name: "asset.update", description: "Update assets" },
    { name: "asset.delete", description: "Delete assets" },
    { name: "workorder.create", description: "Create work orders" },
    { name: "workorder.assign", description: "Assign work orders" },
    { name: "workorder.close", description: "Close work orders" },
    { name: "inventory.issue", description: "Issue inventory stock" },
    { name: "ticket.create", description: "Create helpdesk tickets" },
    { name: "ticket.close", description: "Close helpdesk tickets" },
    { name: "report.view", description: "View analytics reports" },
    { name: "dashboard.view", description: "View KPI dashboard" },
  ];

  const permissionsMap: { [key: string]: Permission } = {};

  for (const permData of permissionsToSeed) {
    let perm = await permissionRepo.findOneBy({ name: permData.name });
    if (!perm) {
      perm = permissionRepo.create(permData);
      await permissionRepo.save(perm);
      console.log(`[Seed] Created permission: ${permData.name}`);
    }
    permissionsMap[permData.name] = perm;
  }

  // 2. Seed Roles
  const rolesToSeed = [
    { name: "SUPER_ADMIN", description: "Super Administrator", permissions: Object.values(permissionsMap) },
    { name: "ADMIN", description: "Administrator", permissions: Object.values(permissionsMap) },
    {
      name: "MANAGER",
      description: "Facilities Manager",
      permissions: [
        permissionsMap["asset.create"],
        permissionsMap["asset.update"],
        permissionsMap["workorder.create"],
        permissionsMap["workorder.assign"],
        permissionsMap["report.view"],
        permissionsMap["dashboard.view"],
      ],
    },
    {
      name: "SUPERVISOR",
      description: "Maintenance Supervisor",
      permissions: [
        permissionsMap["workorder.create"],
        permissionsMap["workorder.assign"],
        permissionsMap["workorder.close"],
        permissionsMap["dashboard.view"],
      ],
    },
    {
      name: "TECHNICIAN",
      description: "Field Technician",
      permissions: [
        permissionsMap["workorder.close"],
        permissionsMap["inventory.issue"],
      ],
    },
    {
      name: "USER",
      description: "General User / Staff",
      permissions: [
        permissionsMap["ticket.create"],
      ],
    },
    {
      name: "CONTRACTOR",
      description: "External Contractor",
      permissions: [
        permissionsMap["workorder.close"],
      ],
    },
  ];

  const rolesMap: { [key: string]: Role } = {};

  for (const roleData of rolesToSeed) {
    let role = await roleRepo.findOneBy({ name: roleData.name });
    if (!role) {
      role = roleRepo.create({
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
      });
      await roleRepo.save(role);
      console.log(`[Seed] Created role: ${roleData.name}`);
    }
    rolesMap[roleData.name] = role;
  }

  // 3. Seed Sample Users
  const usersToSeed = [
    {
      username: "sjenkins",
      email: "sjenkins@assetintelligence.com",
      password: "password123",
      firstName: "Sarah",
      lastName: "Jenkins",
      isActive: true,
      roles: ["ADMIN"],
    },
    {
      username: "rchen",
      email: "rchen@assetintelligence.com",
      password: "password123",
      firstName: "Robert",
      lastName: "Chen",
      isActive: true,
      roles: ["TECHNICIAN"],
    },
    {
      username: "awright",
      email: "awright@assetintelligence.com",
      password: "password123",
      firstName: "Alice",
      lastName: "Wright",
      isActive: true,
      roles: ["MANAGER"],
    },
    {
      username: "jwilson",
      email: "jwilson@assetintelligence.com",
      password: "password123",
      firstName: "James",
      lastName: "Wilson",
      isActive: false, // Inactive user for testing filters
      roles: ["USER"],
    },
  ];

  for (const userData of usersToSeed) {
    let user = await userRepo.findOneBy({ username: userData.username });
    if (!user) {
      const hashedPassword = bcrypt.hashSync(userData.password, 10);
      const userRoles = userData.roles.map((rName) => rolesMap[rName]).filter(Boolean);

      user = userRepo.create({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: userData.isActive,
        roles: userRoles,
      });

      await userRepo.save(user);
      console.log(`[Seed] Created user: ${userData.username} (${userData.roles.join(", ")})`);
    }
  }

  console.log("[Seed] Seeding completed successfully.");
}
