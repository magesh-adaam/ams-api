import { AppDataSource } from "../config/data-source";
import { AssetClassification } from "../entities/AssetClassification";

export class AssetClassificationService {
  private static getClassificationRepository() {
    return AppDataSource.getRepository(AssetClassification);
  }

  static async getAll(filters: {
    search?: string;
    status?: string;
  }): Promise<AssetClassification[]> {
    const classRepo = this.getClassificationRepository();
    const { search, status } = filters;

    const queryBuilder = classRepo.createQueryBuilder("classification");

    if (search) {
      queryBuilder.andWhere(
        "(classification.name ILIKE :search OR classification.code ILIKE :search OR classification.description ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (status && status !== "ALL") {
      const isActive = status === "active" || status === "ACTIVE" || status === "true" || status === "1";
      queryBuilder.andWhere("classification.isActive = :isActive", { isActive });
    }

    queryBuilder.orderBy("classification.createdAt", "DESC");

    return await queryBuilder.getMany();
  }

  static async getById(id: string): Promise<AssetClassification> {
    const classRepo = this.getClassificationRepository();
    const classification = await classRepo.findOneBy({ id });
    if (!classification) {
      throw new Error("Asset classification not found");
    }
    return classification;
  }

  static async create(data: {
    name: string;
    code: string;
    description?: string;
    totalAssetTypes?: number;
    isActive?: boolean;
  }): Promise<AssetClassification> {
    const { name, code, description, totalAssetTypes, isActive } = data;

    if (!name || !code) {
      throw new Error("Missing required fields");
    }

    const classRepo = this.getClassificationRepository();

    // Check duplicate code
    const existing = await classRepo.findOneBy({ code: code.toUpperCase() });
    if (existing) {
      throw new Error("Classification code already in use");
    }

    const newClassification = classRepo.create({
      name,
      code: code.toUpperCase(),
      description,
      totalAssetTypes: totalAssetTypes || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    return await classRepo.save(newClassification);
  }

  static async update(
    id: string,
    data: {
      name?: string;
      code?: string;
      description?: string;
      totalAssetTypes?: number;
      isActive?: boolean;
    }
  ): Promise<AssetClassification> {
    const { name, code, description, totalAssetTypes, isActive } = data;
    const classRepo = this.getClassificationRepository();

    const classification = await classRepo.findOneBy({ id });
    if (!classification) {
      throw new Error("Asset classification not found");
    }

    if (code && code.toUpperCase() !== classification.code) {
      const existing = await classRepo.findOneBy({ code: code.toUpperCase() });
      if (existing) {
        throw new Error("Classification code already in use");
      }
      classification.code = code.toUpperCase();
    }

    if (name) classification.name = name;
    if (description !== undefined) classification.description = description;
    if (totalAssetTypes !== undefined) classification.totalAssetTypes = totalAssetTypes;
    if (isActive !== undefined) classification.isActive = isActive;

    return await classRepo.save(classification);
  }

  static async delete(id: string): Promise<void> {
    const classRepo = this.getClassificationRepository();
    const classification = await classRepo.findOneBy({ id });
    if (!classification) {
      throw new Error("Asset classification not found");
    }

    await classRepo.remove(classification);
  }
}
