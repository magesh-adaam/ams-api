import { AppDataSource } from "../config/data-source";
import { UserLocation } from "../entities/UserLocation";
import { User } from "../entities/User";
import { Facility } from "../entities/Facility";
import { Block } from "../entities/Block";
import { Level } from "../entities/Level";
import { Department } from "../entities/Department";

export class UserLocationService {
  private static getUserLocationRepository() {
    return AppDataSource.getRepository(UserLocation);
  }

  private static getUserRepository() {
    return AppDataSource.getRepository(User);
  }

  private static getFacilityRepository() {
    return AppDataSource.getRepository(Facility);
  }

  private static getBlockRepository() {
    return AppDataSource.getRepository(Block);
  }

  private static getLevelRepository() {
    return AppDataSource.getRepository(Level);
  }

  private static getDepartmentRepository() {
    return AppDataSource.getRepository(Department);
  }

  static async getAll(filters: {
    search?: string;
    facilityId?: string;
    blockId?: string;
    levelId?: string;
    departmentId?: string;
  }): Promise<UserLocation[]> {
    const userLocRepo = this.getUserLocationRepository();
    const { search, facilityId, blockId, levelId, departmentId } = filters;

    const queryBuilder = userLocRepo
      .createQueryBuilder("userLocation")
      .leftJoinAndSelect("userLocation.user", "user")
      .leftJoinAndSelect("user.roles", "role")
      .leftJoinAndSelect("userLocation.facility", "facility")
      .leftJoinAndSelect("userLocation.block", "block")
      .leftJoinAndSelect("userLocation.level", "level")
      .leftJoinAndSelect("userLocation.department", "department");

    if (search) {
      queryBuilder.andWhere(
        "(user.username ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR department.name ILIKE :search OR level.name ILIKE :search OR block.name ILIKE :search OR facility.name ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (facilityId && facilityId !== "ALL" && facilityId !== "") {
      queryBuilder.andWhere("facility.id = :facilityId", { facilityId });
    }

    if (blockId && blockId !== "ALL" && blockId !== "") {
      queryBuilder.andWhere("block.id = :blockId", { blockId });
    }

    if (levelId && levelId !== "ALL" && levelId !== "") {
      queryBuilder.andWhere("level.id = :levelId", { levelId });
    }

    if (departmentId && departmentId !== "ALL" && departmentId !== "") {
      queryBuilder.andWhere("department.id = :departmentId", { departmentId });
    }

    queryBuilder.orderBy("userLocation.createdAt", "DESC");

    return await queryBuilder.getMany();
  }

  static async getById(id: string): Promise<UserLocation> {
    const userLocRepo = this.getUserLocationRepository();
    const userLocation = await userLocRepo.findOne({
      where: { id },
      relations: {
        user: { roles: true },
        facility: true,
        block: true,
        level: true,
        department: true,
      },
    });

    if (!userLocation) {
      throw new Error("User location mapping not found");
    }

    return userLocation;
  }

  static async create(data: {
    userId: string;
    facilityId: string;
    blockId: string;
    levelId: string;
    departmentId: string;
  }): Promise<UserLocation> {
    const { userId, facilityId, blockId, levelId, departmentId } = data;

    if (!userId || !facilityId || !blockId || !levelId || !departmentId) {
      throw new Error("Missing required fields");
    }

    const userLocRepo = this.getUserLocationRepository();

    // Check if duplicate mapping exists
    const existing = await userLocRepo.findOne({
      where: {
        user: { id: userId },
        department: { id: departmentId },
      },
    });
    if (existing) {
      throw new Error("User is already assigned to this department");
    }

    // Resolve entities
    const user = await this.getUserRepository().findOneBy({ id: userId });
    if (!user) throw new Error("User not found");

    const facility = await this.getFacilityRepository().findOneBy({ id: facilityId });
    if (!facility) throw new Error("Facility not found");

    const block = await this.getBlockRepository().findOneBy({ id: blockId });
    if (!block) throw new Error("Block not found");

    const level = await this.getLevelRepository().findOneBy({ id: levelId });
    if (!level) throw new Error("Level not found");

    const department = await this.getDepartmentRepository().findOneBy({ id: departmentId });
    if (!department) throw new Error("Department not found");

    const newUserLocation = userLocRepo.create({
      user,
      facility,
      block,
      level,
      department,
    });

    return await userLocRepo.save(newUserLocation);
  }

  static async update(
    id: string,
    data: {
      userId?: string;
      facilityId?: string;
      blockId?: string;
      levelId?: string;
      departmentId?: string;
    }
  ): Promise<UserLocation> {
    const { userId, facilityId, blockId, levelId, departmentId } = data;
    const userLocRepo = this.getUserLocationRepository();

    const userLocation = await userLocRepo.findOne({
      where: { id },
      relations: {
        user: true,
        facility: true,
        block: true,
        level: true,
        department: true,
      },
    });

    if (!userLocation) {
      throw new Error("User location mapping not found");
    }

    if (userId && userId !== userLocation.user.id) {
      const user = await this.getUserRepository().findOneBy({ id: userId });
      if (!user) throw new Error("User not found");
      userLocation.user = user;
    }

    if (facilityId && facilityId !== userLocation.facility.id) {
      const facility = await this.getFacilityRepository().findOneBy({ id: facilityId });
      if (!facility) throw new Error("Facility not found");
      userLocation.facility = facility;
    }

    if (blockId && blockId !== userLocation.block.id) {
      const block = await this.getBlockRepository().findOneBy({ id: blockId });
      if (!block) throw new Error("Block not found");
      userLocation.block = block;
    }

    if (levelId && levelId !== userLocation.level.id) {
      const level = await this.getLevelRepository().findOneBy({ id: levelId });
      if (!level) throw new Error("Level not found");
      userLocation.level = level;
    }

    if (departmentId && departmentId !== userLocation.department.id) {
      // Check if duplicate mapping would exist
      const checkUserId = userId || userLocation.user.id;
      const existing = await userLocRepo.findOne({
        where: {
          user: { id: checkUserId },
          department: { id: departmentId },
        },
      });
      if (existing && existing.id !== id) {
        throw new Error("User is already assigned to this department");
      }

      const department = await this.getDepartmentRepository().findOneBy({ id: departmentId });
      if (!department) throw new Error("Department not found");
      userLocation.department = department;
    }

    return await userLocRepo.save(userLocation);
  }

  static async delete(id: string): Promise<void> {
    const userLocRepo = this.getUserLocationRepository();
    const userLocation = await userLocRepo.findOneBy({ id });
    if (!userLocation) {
      throw new Error("User location mapping not found");
    }

    await userLocRepo.remove(userLocation);
  }
}
