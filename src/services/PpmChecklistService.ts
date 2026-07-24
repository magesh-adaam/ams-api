import { AppDataSource } from "../config/data-source";
import { PpmChecklist } from "../entities/PpmChecklist";
import { PpmChecklistTask } from "../entities/PpmChecklistTask";
import { AssetType } from "../entities/AssetType";
import { User } from "../entities/User";

export class PpmChecklistService {
  private static getChecklistRepository() {
    return AppDataSource.getRepository(PpmChecklist);
  }

  private static getTaskRepository() {
    return AppDataSource.getRepository(PpmChecklistTask);
  }

  private static getAssetTypeRepository() {
    return AppDataSource.getRepository(AssetType);
  }

  private static getUserRepository() {
    return AppDataSource.getRepository(User);
  }

  static async getAll(filters: {
    search?: string;
    assetTypeId?: string;
    frequency?: string;
    status?: string;
  }): Promise<PpmChecklist[]> {
    const checklistRepo = this.getChecklistRepository();
    const { search, assetTypeId, frequency, status } = filters;

    const queryBuilder = checklistRepo
      .createQueryBuilder("checklist")
      .leftJoinAndSelect("checklist.assetType", "assetType")
      .leftJoinAndSelect("checklist.lastModifiedBy", "lastModifiedBy")
      .leftJoinAndSelect("checklist.tasks", "task");

    if (search) {
      queryBuilder.andWhere(
        "(checklist.name ILIKE :search OR assetType.name ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (assetTypeId && assetTypeId !== "ALL") {
      queryBuilder.andWhere("assetType.id = :assetTypeId", { assetTypeId });
    }

    if (frequency && frequency !== "ALL") {
      queryBuilder.andWhere("checklist.frequency = :frequency", { frequency });
    }

    if (status && status !== "ALL") {
      const isActive = status === "active" || status === "ACTIVE" || status === "true" || status === "1";
      queryBuilder.andWhere("checklist.isActive = :isActive", { isActive });
    }

    queryBuilder.orderBy("checklist.createdAt", "DESC");

    const checklists = await queryBuilder.getMany();

    // Sort tasks in-memory because TypeORM leftJoinAndSelect order can be unpredictable
    checklists.forEach((c) => {
      if (c.tasks) {
        c.tasks.sort((a, b) => a.orderIndex - b.orderIndex);
      }
    });

    return checklists;
  }

  static async getById(id: string): Promise<PpmChecklist> {
    const checklistRepo = this.getChecklistRepository();
    const checklist = await checklistRepo.findOne({
      where: { id },
      relations: {
        assetType: true,
        lastModifiedBy: true,
        tasks: true,
      },
    });

    if (!checklist) {
      throw new Error("PPM Checklist not found");
    }

    if (checklist.tasks) {
      checklist.tasks.sort((a, b) => a.orderIndex - b.orderIndex);
    }

    return checklist;
  }

  static async create(data: {
    name: string;
    frequency: string;
    notes?: string;
    isActive?: boolean;
    assetTypeId: string;
    tasks: { description: string; priority: string }[];
    lastModifiedByUserId?: string;
  }): Promise<PpmChecklist> {
    const { name, frequency, notes, isActive, assetTypeId, tasks, lastModifiedByUserId } = data;

    if (!name || !frequency || !assetTypeId || !tasks || tasks.length === 0) {
      throw new Error("Missing required fields");
    }

    const checklistRepo = this.getChecklistRepository();
    const assetTypeRepo = this.getAssetTypeRepository();
    const userRepo = this.getUserRepository();

    const assetType = await assetTypeRepo.findOneBy({ id: assetTypeId });
    if (!assetType) {
      throw new Error("Asset type not found");
    }

    let lastModifiedBy: User | undefined;
    if (lastModifiedByUserId) {
      const user = await userRepo.findOneBy({ id: lastModifiedByUserId });
      if (user) {
        lastModifiedBy = user;
      }
    }

    const checklist = checklistRepo.create({
      name,
      frequency,
      notes,
      isActive: isActive !== undefined ? isActive : true,
      assetType,
      lastModifiedBy,
    });

    const savedChecklist = await checklistRepo.save(checklist);

    // Save tasks
    const taskRepo = this.getTaskRepository();
    const taskEntities = tasks.map((t, idx) =>
      taskRepo.create({
        description: t.description,
        priority: t.priority,
        orderIndex: idx,
        checklist: savedChecklist,
      })
    );

    await taskRepo.save(taskEntities);
    
    // Return reloaded checklist
    return this.getById(savedChecklist.id);
  }

  static async update(
    id: string,
    data: {
      name?: string;
      frequency?: string;
      notes?: string;
      isActive?: boolean;
      assetTypeId?: string;
      tasks?: { description: string; priority: string }[];
      lastModifiedByUserId?: string;
    }
  ): Promise<PpmChecklist> {
    const { name, frequency, notes, isActive, assetTypeId, tasks, lastModifiedByUserId } = data;
    const checklistRepo = this.getChecklistRepository();

    const checklist = await checklistRepo.findOne({
      where: { id },
      relations: { assetType: true, lastModifiedBy: true },
    });

    if (!checklist) {
      throw new Error("PPM Checklist not found");
    }

    if (name) checklist.name = name;
    if (frequency) checklist.frequency = frequency;
    if (notes !== undefined) checklist.notes = notes;
    if (isActive !== undefined) checklist.isActive = isActive;

    if (assetTypeId && assetTypeId !== checklist.assetType.id) {
      const assetTypeRepo = this.getAssetTypeRepository();
      const assetType = await assetTypeRepo.findOneBy({ id: assetTypeId });
      if (!assetType) {
        throw new Error("Asset type not found");
      }
      checklist.assetType = assetType;
    }

    if (lastModifiedByUserId) {
      const userRepo = this.getUserRepository();
      const user = await userRepo.findOneBy({ id: lastModifiedByUserId });
      if (user) {
        checklist.lastModifiedBy = user;
      }
    }

    await checklistRepo.save(checklist);

    // If tasks are provided, replace them
    if (tasks) {
      const taskRepo = this.getTaskRepository();
      
      // Delete existing tasks
      await taskRepo.delete({ checklist: { id: checklist.id } });

      // Save new tasks
      const taskEntities = tasks.map((t, idx) =>
        taskRepo.create({
          description: t.description,
          priority: t.priority,
          orderIndex: idx,
          checklist: checklist,
        })
      );

      await taskRepo.save(taskEntities);
    }

    return this.getById(checklist.id);
  }

  static async delete(id: string): Promise<void> {
    const checklistRepo = this.getChecklistRepository();
    const checklist = await checklistRepo.findOneBy({ id });
    if (!checklist) {
      throw new Error("PPM Checklist not found");
    }
    await checklistRepo.remove(checklist);
  }
}
