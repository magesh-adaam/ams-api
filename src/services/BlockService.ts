import { AppDataSource } from "../config/data-source";
import { Block } from "../entities/Block";
import { Facility } from "../entities/Facility";

export class BlockService {
  private static getBlockRepository() {
    return AppDataSource.getRepository(Block);
  }

  private static getFacilityRepository() {
    return AppDataSource.getRepository(Facility);
  }

  static async getAll(filters: { search?: string; facilityId?: string; status?: string }): Promise<Block[]> {
    const blockRepo = this.getBlockRepository();
    const { search, facilityId, status } = filters;

    const queryBuilder = blockRepo.createQueryBuilder("block")
      .leftJoinAndSelect("block.facility", "facility");

    if (search) {
      queryBuilder.andWhere(
        "(block.name ILIKE :search OR block.code ILIKE :search OR facility.name ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (facilityId && facilityId !== "ALL" && facilityId !== "") {
      queryBuilder.andWhere("facility.id = :facilityId", { facilityId });
    }

    if (status && status !== "ALL") {
      const isActive = status === "active" || status === "ACTIVE" || status === "true" || status === "1";
      queryBuilder.andWhere("block.isActive = :isActive", { isActive });
    }

    queryBuilder.orderBy("block.createdAt", "DESC");

    return await queryBuilder.getMany();
  }

  static async getById(id: string): Promise<Block> {
    const blockRepo = this.getBlockRepository();
    const block = await blockRepo.findOne({
      where: { id },
      relations: { facility: true },
    });
    if (!block) {
      throw new Error("Block not found");
    }
    return block;
  }

  static async create(blockData: {
    name: string;
    code: string;
    totalLevels: number;
    facilityId: string;
    isActive?: boolean;
  }): Promise<Block> {
    const { name, code, totalLevels, facilityId, isActive } = blockData;

    if (!name || !code || !facilityId) {
      throw new Error("Missing required fields");
    }

    const blockRepo = this.getBlockRepository();

    // Check duplicate code
    const existingBlock = await blockRepo.findOneBy({ code });
    if (existingBlock) {
      throw new Error("Block code already in use");
    }

    const facilityRepo = this.getFacilityRepository();
    const facility = await facilityRepo.findOneBy({ id: facilityId });
    if (!facility) {
      throw new Error("Facility not found");
    }

    const newBlock = blockRepo.create({
      name,
      code,
      totalLevels: Number(totalLevels) || 0,
      facility,
      isActive: isActive !== undefined ? isActive : true,
    });

    return await blockRepo.save(newBlock);
  }

  static async update(
    id: string,
    blockData: {
      name?: string;
      code?: string;
      totalLevels?: number;
      facilityId?: string;
      isActive?: boolean;
    }
  ): Promise<Block> {
    const { name, code, totalLevels, facilityId, isActive } = blockData;
    const blockRepo = this.getBlockRepository();

    const block = await blockRepo.findOne({
      where: { id },
      relations: { facility: true },
    });
    if (!block) {
      throw new Error("Block not found");
    }

    if (code && code !== block.code) {
      const existingBlock = await blockRepo.findOneBy({ code });
      if (existingBlock) {
        throw new Error("Block code already in use");
      }
      block.code = code;
    }

    if (name) block.name = name;
    if (totalLevels !== undefined) block.totalLevels = Number(totalLevels) || 0;
    if (isActive !== undefined) block.isActive = isActive;

    if (facilityId) {
      const facilityRepo = this.getFacilityRepository();
      const facility = await facilityRepo.findOneBy({ id: facilityId });
      if (!facility) {
        throw new Error("Facility not found");
      }
      block.facility = facility;
    }

    return await blockRepo.save(block);
  }

  static async delete(id: string): Promise<void> {
    const blockRepo = this.getBlockRepository();
    const block = await blockRepo.findOneBy({ id });
    if (!block) {
      throw new Error("Block not found");
    }
    await blockRepo.remove(block);
  }
}
