import { AppDataSource } from "../config/data-source";
import { Asset } from "../entities/Asset";
import { AssetType } from "../entities/AssetType";
import { Facility } from "../entities/Facility";
import { Department } from "../entities/Department";

export class AssetService {
  private static getAssetRepository() {
    return AppDataSource.getRepository(Asset);
  }

  private static getAssetTypeRepository() {
    return AppDataSource.getRepository(AssetType);
  }

  private static getFacilityRepository() {
    return AppDataSource.getRepository(Facility);
  }

  private static getDepartmentRepository() {
    return AppDataSource.getRepository(Department);
  }

  static async getAll(filters: {
    search?: string;
    assetTypeId?: string;
    status?: string;
    manufacturer?: string;
    facilityId?: string;
    departmentId?: string;
    model?: string;
    serialNumber?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Asset[]> {
    const assetRepo = this.getAssetRepository();
    const {
      search,
      assetTypeId,
      status,
      manufacturer,
      facilityId,
      departmentId,
      model,
      serialNumber,
      startDate,
      endDate,
    } = filters;

    const queryBuilder = assetRepo
      .createQueryBuilder("asset")
      .leftJoinAndSelect("asset.assetType", "assetType")
      .leftJoinAndSelect("asset.facility", "facility")
      .leftJoinAndSelect("asset.department", "department");

    if (search) {
      queryBuilder.andWhere(
        "(asset.name ILIKE :search OR asset.serialNumber ILIKE :search OR asset.model ILIKE :search OR asset.manufacturer ILIKE :search OR department.name ILIKE :search OR facility.name ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (assetTypeId && assetTypeId !== "ALL") {
      queryBuilder.andWhere("assetType.id = :assetTypeId", { assetTypeId });
    }

    if (status && status !== "ALL") {
      queryBuilder.andWhere("asset.status = :status", { status });
    }

    if (manufacturer && manufacturer !== "ALL") {
      queryBuilder.andWhere("asset.manufacturer ILIKE :manufacturer", { manufacturer: `%${manufacturer}%` });
    }

    if (facilityId && facilityId !== "ALL") {
      queryBuilder.andWhere("facility.id = :facilityId", { facilityId });
    }

    if (departmentId && departmentId !== "ALL") {
      queryBuilder.andWhere("department.id = :departmentId", { departmentId });
    }

    if (model) {
      queryBuilder.andWhere("asset.model ILIKE :model", { model: `%${model}%` });
    }

    if (serialNumber) {
      queryBuilder.andWhere("asset.serialNumber ILIKE :serialNumber", { serialNumber: `%${serialNumber}%` });
    }

    if (startDate) {
      queryBuilder.andWhere("asset.createdAt >= :startDate", { startDate: new Date(startDate) });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere("asset.createdAt <= :endDate", { endDate: end });
    }

    queryBuilder.orderBy("asset.createdAt", "DESC");

    return await queryBuilder.getMany();
  }

  static async getById(id: string): Promise<Asset> {
    const assetRepo = this.getAssetRepository();
    const asset = await assetRepo.findOne({
      where: { id },
      relations: { assetType: true, facility: true, department: true },
    });
    if (!asset) {
      throw new Error("Asset not found");
    }
    return asset;
  }

  static async create(data: {
    name: string;
    model: string;
    manufacturer: string;
    serialNumber: string;
    assetTypeId: string;
    facilityId: string;
    departmentId: string;
    status?: string;
  }): Promise<Asset> {
    const { name, model, manufacturer, serialNumber, assetTypeId, facilityId, departmentId, status } = data;

    if (!name || !model || !manufacturer || !serialNumber || !assetTypeId || !facilityId || !departmentId) {
      throw new Error("Missing required fields");
    }

    const assetRepo = this.getAssetRepository();
    const typeRepo = this.getAssetTypeRepository();
    const facilityRepo = this.getFacilityRepository();
    const deptRepo = this.getDepartmentRepository();

    // Check duplicate serial number
    const existing = await assetRepo.findOneBy({ serialNumber: serialNumber.toUpperCase() });
    if (existing) {
      throw new Error("Asset serial number already in use");
    }

    // Load relations
    const assetType = await typeRepo.findOneBy({ id: assetTypeId });
    if (!assetType) {
      throw new Error("Asset type not found");
    }

    const facility = await facilityRepo.findOneBy({ id: facilityId });
    if (!facility) {
      throw new Error("Facility not found");
    }

    const department = await deptRepo.findOneBy({ id: departmentId });
    if (!department) {
      throw new Error("Department not found");
    }

    const newAsset = assetRepo.create({
      name,
      model,
      manufacturer,
      serialNumber: serialNumber.toUpperCase(),
      status: status || "ACTIVE",
      assetType,
      facility,
      department,
    });

    const savedAsset = await assetRepo.save(newAsset);

    // Update parent AssetType count
    assetType.totalAssets = (assetType.totalAssets || 0) + 1;
    await typeRepo.save(assetType);

    return savedAsset;
  }

  static async update(
    id: string,
    data: {
      name?: string;
      model?: string;
      manufacturer?: string;
      serialNumber?: string;
      assetTypeId?: string;
      facilityId?: string;
      departmentId?: string;
      status?: string;
    }
  ): Promise<Asset> {
    const { name, model, manufacturer, serialNumber, assetTypeId, facilityId, departmentId, status } = data;
    const assetRepo = this.getAssetRepository();

    const asset = await assetRepo.findOne({
      where: { id },
      relations: { assetType: true, facility: true, department: true },
    });
    if (!asset) {
      throw new Error("Asset not found");
    }

    if (serialNumber && serialNumber !== asset.serialNumber) {
      const existing = await assetRepo.findOneBy({ serialNumber: serialNumber.toUpperCase() });
      if (existing) {
        throw new Error("Asset serial number already in use");
      }
      asset.serialNumber = serialNumber.toUpperCase();
    }

    if (name) asset.name = name;
    if (model) asset.model = model;
    if (manufacturer) asset.manufacturer = manufacturer;
    if (status) asset.status = status;

    if (facilityId && facilityId !== asset.facility.id) {
      const facilityRepo = this.getFacilityRepository();
      const newFacility = await facilityRepo.findOneBy({ id: facilityId });
      if (!newFacility) {
        throw new Error("Facility not found");
      }
      asset.facility = newFacility;
    }

    if (departmentId && departmentId !== asset.department.id) {
      const deptRepo = this.getDepartmentRepository();
      const newDept = await deptRepo.findOneBy({ id: departmentId });
      if (!newDept) {
        throw new Error("Department not found");
      }
      asset.department = newDept;
    }

    if (assetTypeId && assetTypeId !== asset.assetType.id) {
      const typeRepo = this.getAssetTypeRepository();
      const newType = await typeRepo.findOneBy({ id: assetTypeId });
      if (!newType) {
        throw new Error("New asset type not found");
      }

      // Decrement count in old type
      const oldType = asset.assetType;
      oldType.totalAssets = Math.max(0, (oldType.totalAssets || 0) - 1);
      await typeRepo.save(oldType);

      // Increment count in new type
      newType.totalAssets = (newType.totalAssets || 0) + 1;
      await typeRepo.save(newType);

      asset.assetType = newType;
    }

    return await assetRepo.save(asset);
  }

  static async delete(id: string): Promise<void> {
    const assetRepo = this.getAssetRepository();
    const asset = await assetRepo.findOne({
      where: { id },
      relations: { assetType: true },
    });
    if (!asset) {
      throw new Error("Asset not found");
    }

    const typeRepo = this.getAssetTypeRepository();
    const assetType = asset.assetType;
    if (assetType) {
      assetType.totalAssets = Math.max(0, (assetType.totalAssets || 0) - 1);
      await typeRepo.save(assetType);
    }

    await assetRepo.remove(asset);
  }
}
