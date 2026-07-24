import { AppDataSource } from "../config/data-source";
import { Level } from "../entities/Level";
import { Block } from "../entities/Block";

export class LevelService {
  private static getLevelRepository() {
    return AppDataSource.getRepository(Level);
  }

  private static getBlockRepository() {
    return AppDataSource.getRepository(Block);
  }

  static async getAll(filters: {
    search?: string;
    facilityId?: string;
    blockId?: string;
    status?: string;
  }): Promise<Level[]> {
    const levelRepo = this.getLevelRepository();
    const { search, facilityId, blockId, status } = filters;

    const queryBuilder = levelRepo
      .createQueryBuilder("level")
      .leftJoinAndSelect("level.block", "block")
      .leftJoinAndSelect("block.facility", "facility");

    if (search) {
      queryBuilder.andWhere(
        "(level.name ILIKE :search OR level.code ILIKE :search OR block.name ILIKE :search OR facility.name ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (facilityId && facilityId !== "ALL" && facilityId !== "") {
      queryBuilder.andWhere("facility.id = :facilityId", { facilityId });
    }

    if (blockId && blockId !== "ALL" && blockId !== "") {
      queryBuilder.andWhere("block.id = :blockId", { blockId });
    }

    if (status && status !== "ALL") {
      const isActive = status === "active" || status === "ACTIVE" || status === "true" || status === "1";
      queryBuilder.andWhere("level.isActive = :isActive", { isActive });
    }

    queryBuilder.orderBy("level.createdAt", "DESC");

    return await queryBuilder.getMany();
  }

  static async getById(id: string): Promise<Level> {
    const levelRepo = this.getLevelRepository();
    const level = await levelRepo.findOne({
      where: { id },
      relations: { block: { facility: true } },
    });
    if (!level) {
      throw new Error("Level not found");
    }
    return level;
  }

  static async create(levelData: {
    name: string;
    code: string;
    blockId: string;
    isActive?: boolean;
  }): Promise<Level> {
    const { name, code, blockId, isActive } = levelData;

    if (!name || !code || !blockId) {
      throw new Error("Missing required fields");
    }

    const levelRepo = this.getLevelRepository();

    // Check duplicate code
    const existingLevel = await levelRepo.findOneBy({ code });
    if (existingLevel) {
      throw new Error("Level code already in use");
    }

    const blockRepo = this.getBlockRepository();
    const block = await blockRepo.findOne({
      where: { id: blockId },
      relations: { facility: true },
    });
    if (!block) {
      throw new Error("Block not found");
    }

    const newLevel = levelRepo.create({
      name,
      code,
      block,
      isActive: isActive !== undefined ? isActive : true,
    });

    const savedLevel = await levelRepo.save(newLevel);

    // Update block levels count
    block.totalLevels = (block.totalLevels || 0) + 1;
    await blockRepo.save(block);

    return savedLevel;
  }

  static async update(
    id: string,
    levelData: {
      name?: string;
      code?: string;
      blockId?: string;
      isActive?: boolean;
    }
  ): Promise<Level> {
    const { name, code, blockId, isActive } = levelData;
    const levelRepo = this.getLevelRepository();

    const level = await levelRepo.findOne({
      where: { id },
      relations: { block: { facility: true } },
    });
    if (!level) {
      throw new Error("Level not found");
    }

    if (code && code !== level.code) {
      const existingLevel = await levelRepo.findOneBy({ code });
      if (existingLevel) {
        throw new Error("Level code already in use");
      }
      level.code = code;
    }

    if (name) level.name = name;
    if (isActive !== undefined) level.isActive = isActive;

    if (blockId && blockId !== level.block.id) {
      const blockRepo = this.getBlockRepository();
      
      // Load new block
      const newBlock = await blockRepo.findOneBy({ id: blockId });
      if (!newBlock) {
        throw new Error("New block not found");
      }

      // Decrement levels count from old block
      const oldBlock = level.block;
      oldBlock.totalLevels = Math.max(0, (oldBlock.totalLevels || 0) - 1);
      await blockRepo.save(oldBlock);

      // Increment levels count in new block
      newBlock.totalLevels = (newBlock.totalLevels || 0) + 1;
      await blockRepo.save(newBlock);

      level.block = newBlock;
    }

    return await levelRepo.save(level);
  }

  static async delete(id: string): Promise<void> {
    const levelRepo = this.getLevelRepository();
    const level = await levelRepo.findOne({
      where: { id },
      relations: { block: true },
    });
    if (!level) {
      throw new Error("Level not found");
    }

    const blockRepo = this.getBlockRepository();
    const block = level.block;
    if (block) {
      block.totalLevels = Math.max(0, (block.totalLevels || 0) - 1);
      await blockRepo.save(block);
    }

    await levelRepo.remove(level);
  }
}
