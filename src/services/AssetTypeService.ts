import { AppDataSource } from "../config/data-source";
import { AssetType } from "../entities/AssetType";
import { AssetClassification } from "../entities/AssetClassification";

export class AssetTypeService {
  private static getAssetTypeRepository() {
    return AppDataSource.getRepository(AssetType);
  }

  private static getClassificationRepository() {
    return AppDataSource.getRepository(AssetClassification);
  }

  static async getAll(filters: {
    search?: string;
    classificationId?: string;
    status?: string;
  }): Promise<AssetType[]> {
    const assetTypeRepo = this.getAssetTypeRepository();
    const { search, classificationId, status } = filters;

    const queryBuilder = assetTypeRepo
      .createQueryBuilder("assetType")
      .leftJoinAndSelect("assetType.classification", "classification");

    if (search) {
      queryBuilder.andWhere(
        "(assetType.name ILIKE :search OR assetType.code ILIKE :search OR assetType.description ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (classificationId && classificationId !== "ALL") {
      queryBuilder.andWhere("classification.id = :classificationId", { classificationId });
    }

    if (status && status !== "ALL") {
      const isActive = status === "active" || status === "ACTIVE" || status === "true" || status === "1";
      queryBuilder.andWhere("assetType.isActive = :isActive", { isActive });
    }

    queryBuilder.orderBy("assetType.createdAt", "DESC");

    return await queryBuilder.getMany();
  }

  static async getById(id: string): Promise<AssetType> {
    const assetTypeRepo = this.getAssetTypeRepository();
    const assetType = await assetTypeRepo.findOne({
      where: { id },
      relations: { classification: true },
    });
    if (!assetType) {
      throw new Error("Asset type not found");
    }
    return assetType;
  }

  static async create(data: {
    name: string;
    code: string;
    description?: string;
    classificationId: string;
    totalAssets?: number;
    isActive?: boolean;
  }): Promise<AssetType> {
    const { name, code, description, classificationId, totalAssets, isActive } = data;

    if (!name || !code || !classificationId) {
      throw new Error("Missing required fields");
    }

    const assetTypeRepo = this.getAssetTypeRepository();
    const classificationRepo = this.getClassificationRepository();

    // Check duplicate code
    const existing = await assetTypeRepo.findOneBy({ code: code.toUpperCase() });
    if (existing) {
      throw new Error("Asset type code already in use");
    }

    // Load classification
    const classification = await classificationRepo.findOneBy({ id: classificationId });
    if (!classification) {
      throw new Error("Asset classification not found");
    }

    const newAssetType = assetTypeRepo.create({
      name,
      code: code.toUpperCase(),
      description,
      totalAssets: totalAssets || 0,
      classification,
      isActive: isActive !== undefined ? isActive : true,
    });

    const savedAssetType = await assetTypeRepo.save(newAssetType);

    // Update parent classification count
    classification.totalAssetTypes = (classification.totalAssetTypes || 0) + 1;
    await classificationRepo.save(classification);

    return savedAssetType;
  }

  static async update(
    id: string,
    data: {
      name?: string;
      code?: string;
      description?: string;
      classificationId?: string;
      totalAssets?: number;
      isActive?: boolean;
    }
  ): Promise<AssetType> {
    const { name, code, description, classificationId, totalAssets, isActive } = data;
    const assetTypeRepo = this.getAssetTypeRepository();

    const assetType = await assetTypeRepo.findOne({
      where: { id },
      relations: { classification: true },
    });
    if (!assetType) {
      throw new Error("Asset type not found");
    }

    if (code && code !== assetType.code) {
      const existing = await assetTypeRepo.findOneBy({ code: code.toUpperCase() });
      if (existing) {
        throw new Error("Asset type code already in use");
      }
      assetType.code = code.toUpperCase();
    }

    if (name) assetType.name = name;
    if (description !== undefined) assetType.description = description;
    if (totalAssets !== undefined) assetType.totalAssets = totalAssets;
    if (isActive !== undefined) assetType.isActive = isActive;

    if (classificationId && classificationId !== assetType.classification.id) {
      const classificationRepo = this.getClassificationRepository();

      const newClassification = await classificationRepo.findOneBy({ id: classificationId });
      if (!newClassification) {
        throw new Error("New asset classification not found");
      }

      // Decrement count in old classification
      const oldClassification = assetType.classification;
      oldClassification.totalAssetTypes = Math.max(0, (oldClassification.totalAssetTypes || 0) - 1);
      await classificationRepo.save(oldClassification);

      // Increment count in new classification
      newClassification.totalAssetTypes = (newClassification.totalAssetTypes || 0) + 1;
      await classificationRepo.save(newClassification);

      assetType.classification = newClassification;
    }

    return await assetTypeRepo.save(assetType);
  }

  static async delete(id: string): Promise<void> {
    const assetTypeRepo = this.getAssetTypeRepository();
    const assetType = await assetTypeRepo.findOne({
      where: { id },
      relations: { classification: true },
    });
    if (!assetType) {
      throw new Error("Asset type not found");
    }

    const classificationRepo = this.getClassificationRepository();
    const classification = assetType.classification;
    if (classification) {
      classification.totalAssetTypes = Math.max(0, (classification.totalAssetTypes || 0) - 1);
      await classificationRepo.save(classification);
    }

    await assetTypeRepo.remove(assetType);
  }
}
