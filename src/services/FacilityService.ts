import { AppDataSource } from "../config/data-source";
import { Facility } from "../entities/Facility";

export class FacilityService {
  private static getFacilityRepository() {
    return AppDataSource.getRepository(Facility);
  }

  static async getAll(filters: { search?: string; type?: string; status?: string }): Promise<Facility[]> {
    const facilityRepo = this.getFacilityRepository();
    const { search, type, status } = filters;

    const queryBuilder = facilityRepo.createQueryBuilder("facility");

    if (search) {
      queryBuilder.andWhere(
        "(facility.name ILIKE :search OR facility.code ILIKE :search OR facility.type ILIKE :search OR facility.addressLine1 ILIKE :search OR facility.city ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (type && type !== "ALL" && type !== "") {
      queryBuilder.andWhere("facility.type = :type", { type });
    }

    if (status && status !== "ALL") {
      const isActive = status === "active" || status === "ACTIVE" || status === "true" || status === "1";
      queryBuilder.andWhere("facility.isActive = :isActive", { isActive });
    }

    queryBuilder.orderBy("facility.name", "ASC");

    return await queryBuilder.getMany();
  }

  static async getById(id: string): Promise<Facility | null> {
    const facilityRepo = this.getFacilityRepository();
    return await facilityRepo.findOne({
      where: { id },
      relations: { blocks: true }, // Include blocks relation if needed
    });
  }

  static async create(facilityData: {
    name: string;
    code?: string;
    type?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    stateProvince?: string;
    postcode?: string;
    contactNumber?: string;
    emailAddress?: string;
    isActive?: boolean;
  }): Promise<Facility> {
    const { name, code } = facilityData;
    if (!name) {
      throw new Error("Facility Name is required");
    }

    const facilityRepo = this.getFacilityRepository();

    // Check duplicate name
    const existingByName = await facilityRepo.findOneBy({ name });
    if (existingByName) {
      throw new Error("Facility name already in use");
    }

    // Check duplicate code
    if (code) {
      const existingByCode = await facilityRepo.findOneBy({ code });
      if (existingByCode) {
        throw new Error("Facility code already in use");
      }
    }

    const newFacility = facilityRepo.create({
      ...facilityData,
      isActive: facilityData.isActive !== undefined ? facilityData.isActive : true,
    });

    return await facilityRepo.save(newFacility);
  }

  static async update(
    id: string,
    facilityData: {
      name?: string;
      code?: string;
      type?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      stateProvince?: string;
      postcode?: string;
      contactNumber?: string;
      emailAddress?: string;
      isActive?: boolean;
    }
  ): Promise<Facility> {
    const { name, code } = facilityData;
    const facilityRepo = this.getFacilityRepository();

    const facility = await facilityRepo.findOneBy({ id });
    if (!facility) {
      throw new Error("Facility not found");
    }

    if (name && name !== facility.name) {
      const existingByName = await facilityRepo.findOneBy({ name });
      if (existingByName) {
        throw new Error("Facility name already in use");
      }
      facility.name = name;
    }

    if (code && code !== facility.code) {
      const existingByCode = await facilityRepo.findOneBy({ code });
      if (existingByCode) {
        throw new Error("Facility code already in use");
      }
      facility.code = code;
    }

    // Assign other properties
    Object.assign(facility, {
      ...facilityData,
      name: name || facility.name,
      code: code !== undefined ? code : facility.code,
    });

    return await facilityRepo.save(facility);
  }

  static async delete(id: string): Promise<void> {
    const facilityRepo = this.getFacilityRepository();
    const facility = await facilityRepo.findOneBy({ id });
    if (!facility) {
      throw new Error("Facility not found");
    }
    await facilityRepo.remove(facility);
  }
}
