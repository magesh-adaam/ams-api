import { AppDataSource } from "../config/data-source";
import { Department } from "../entities/Department";
import { Level } from "../entities/Level";

export class DepartmentService {
  private static getDepartmentRepository() {
    return AppDataSource.getRepository(Department);
  }

  private static getLevelRepository() {
    return AppDataSource.getRepository(Level);
  }

  static async getAll(filters: {
    search?: string;
    facilityId?: string;
    blockId?: string;
    levelId?: string;
    status?: string;
  }): Promise<Department[]> {
    const deptRepo = this.getDepartmentRepository();
    const { search, facilityId, blockId, levelId, status } = filters;

    const queryBuilder = deptRepo
      .createQueryBuilder("department")
      .leftJoinAndSelect("department.level", "level")
      .leftJoinAndSelect("level.block", "block")
      .leftJoinAndSelect("block.facility", "facility");

    if (search) {
      queryBuilder.andWhere(
        "(department.name ILIKE :search OR department.code ILIKE :search OR level.name ILIKE :search OR block.name ILIKE :search OR facility.name ILIKE :search)",
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

    if (status && status !== "ALL") {
      const isActive = status === "active" || status === "ACTIVE" || status === "true" || status === "1";
      queryBuilder.andWhere("department.isActive = :isActive", { isActive });
    }

    queryBuilder.orderBy("department.createdAt", "DESC");

    return await queryBuilder.getMany();
  }

  static async getById(id: string): Promise<Department> {
    const deptRepo = this.getDepartmentRepository();
    const department = await deptRepo.findOne({
      where: { id },
      relations: { level: { block: { facility: true } } },
    });
    if (!department) {
      throw new Error("Department not found");
    }
    return department;
  }

  static async create(deptData: {
    name: string;
    code: string;
    levelId: string;
    isActive?: boolean;
  }): Promise<Department> {
    const { name, code, levelId, isActive } = deptData;

    if (!name || !code || !levelId) {
      throw new Error("Missing required fields");
    }

    const deptRepo = this.getDepartmentRepository();

    // Check duplicate code
    const existingDept = await deptRepo.findOneBy({ code });
    if (existingDept) {
      throw new Error("Department code already in use");
    }

    const levelRepo = this.getLevelRepository();
    const level = await levelRepo.findOne({
      where: { id: levelId },
      relations: { block: { facility: true } },
    });
    if (!level) {
      throw new Error("Level not found");
    }

    const newDept = deptRepo.create({
      name,
      code,
      level,
      isActive: isActive !== undefined ? isActive : true,
    });

    return await deptRepo.save(newDept);
  }

  static async update(
    id: string,
    deptData: {
      name?: string;
      code?: string;
      levelId?: string;
      isActive?: boolean;
    }
  ): Promise<Department> {
    const { name, code, levelId, isActive } = deptData;
    const deptRepo = this.getDepartmentRepository();

    const department = await deptRepo.findOne({
      where: { id },
      relations: { level: { block: { facility: true } } },
    });
    if (!department) {
      throw new Error("Department not found");
    }

    if (code && code !== department.code) {
      const existingDept = await deptRepo.findOneBy({ code });
      if (existingDept) {
        throw new Error("Department code already in use");
      }
      department.code = code;
    }

    if (name) department.name = name;
    if (isActive !== undefined) department.isActive = isActive;

    if (levelId && levelId !== department.level.id) {
      const levelRepo = this.getLevelRepository();
      const newLevel = await levelRepo.findOneBy({ id: levelId });
      if (!newLevel) {
        throw new Error("New level not found");
      }
      department.level = newLevel;
    }

    return await deptRepo.save(department);
  }

  static async delete(id: string): Promise<void> {
    const deptRepo = this.getDepartmentRepository();
    const department = await deptRepo.findOneBy({ id });
    if (!department) {
      throw new Error("Department not found");
    }

    await deptRepo.remove(department);
  }
}
