import { AppDataSource } from "../config/data-source";
import { Role } from "../entities/Role";
import { Permission } from "../entities/Permission";
import { User } from "../entities/User";
import { Facility } from "../entities/Facility";
import { Block } from "../entities/Block";
import { Level } from "../entities/Level";
import { Department } from "../entities/Department";
import { UserLocation } from "../entities/UserLocation";
import { AssetClassification } from "../entities/AssetClassification";
import { AssetType } from "../entities/AssetType";
import { Asset } from "../entities/Asset";
import { PpmChecklist } from "../entities/PpmChecklist";
import { PpmChecklistTask } from "../entities/PpmChecklistTask";
import * as bcrypt from "bcryptjs";

export async function seedDatabase() {
  const roleRepo = AppDataSource.getRepository(Role);
  const permissionRepo = AppDataSource.getRepository(Permission);
  const userRepo = AppDataSource.getRepository(User);
  const facilityRepo = AppDataSource.getRepository(Facility);
  const blockRepo = AppDataSource.getRepository(Block);

  // 1. Seed Permissions
  const permissionsToSeed = [
    { name: "read", description: "Read action permission" },
    { name: "edit", description: "Edit action permission" },
    { name: "view", description: "View action permission" },
    { name: "delete", description: "Delete action permission" },
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
    {
      name: "CHIEF_SURGEON",
      description: "Chief Surgeon",
      permissions: [
        permissionsMap["read"],
        permissionsMap["view"],
      ],
    },
    {
      name: "RADIOLOGIST",
      description: "Radiologist",
      permissions: [
        permissionsMap["read"],
        permissionsMap["view"],
      ],
    },
    {
      name: "NURSING_SUPERVISOR",
      description: "Nursing Supervisor",
      permissions: [
        permissionsMap["read"],
        permissionsMap["view"],
      ],
    },
    {
      name: "OPERATIONS_MANAGER",
      description: "Operations Manager",
      permissions: [
        permissionsMap["read"],
        permissionsMap["view"],
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
      username: "superadmin",
      email: "magesharumugaraj@gmail.com",
      password: "admin123",
      firstName: "Magesh",
      lastName: "Arumugaraj",
      isActive: true,
      roles: ["SUPER_ADMIN"],
    },
    {
      username: "sjenkins",
      email: "sjenkins@assetintelligence.com",
      password: "password123",
      firstName: "Sarah",
      lastName: "Jenkins",
      isActive: true,
      roles: ["ADMIN", "CHIEF_SURGEON"],
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
      isActive: true,
      roles: ["USER", "NURSING_SUPERVISOR"],
    },
    {
      username: "mthompson",
      email: "mthompson@assetintelligence.com",
      password: "password123",
      firstName: "Mark",
      lastName: "Thompson",
      isActive: true,
      roles: ["RADIOLOGIST"],
    },
    {
      username: "erodriguez",
      email: "erodriguez@assetintelligence.com",
      password: "password123",
      firstName: "Elena",
      lastName: "Rodriguez",
      isActive: true,
      roles: ["OPERATIONS_MANAGER"],
    },
    {
      username: "mross",
      email: "mross@assetintelligence.com",
      password: "password123",
      firstName: "Mike",
      lastName: "Ross",
      isActive: true,
      roles: ["ADMIN"],
    },
    {
      username: "acarter",
      email: "acarter@assetintelligence.com",
      password: "password123",
      firstName: "Alex",
      lastName: "Carter",
      isActive: true,
      roles: ["ADMIN"],
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

  // 4. Seed Facilities
  const facilitiesToSeed = [
    {
      name: "City General Hospital",
      code: "CGH-001",
      type: "Hospital",
      addressLine1: "Downtown, North Wing Ave 42",
      city: "Cityville",
      stateProvince: "State",
      postcode: "12345",
      contactNumber: "+1 (555) 123-4567",
      emailAddress: "info@citygeneral.com",
      isActive: true,
    },
    {
      name: "Riverside Specialty Clinic",
      code: "RSC-012",
      type: "Clinic",
      addressLine1: "East Riverside Dr, Bldg 4",
      city: "Riverside",
      stateProvince: "State",
      postcode: "12345",
      contactNumber: "+1 (555) 987-6543",
      emailAddress: "admin@riverside.com",
      isActive: true,
    },
    {
      name: "Central Medical Stores",
      code: "CMS-WH1",
      type: "Warehouse",
      addressLine1: "Industrial Zone, Port Road",
      city: "Metro City",
      stateProvince: "State",
      postcode: "12345",
      contactNumber: "+1 (555) 555-5555",
      emailAddress: "logistics@centralstores.com",
      isActive: true,
    },
    {
      name: "Southside Outreach Unit",
      code: "SOU-005",
      type: "Clinic",
      addressLine1: "South Ridge Mall, Level 1",
      city: "Southside",
      stateProvince: "State",
      postcode: "12345",
      contactNumber: "+1 (555) 333-3333",
      emailAddress: "outreach@southside.com",
      isActive: false,
    },
  ];

  const facilitiesMap: { [key: string]: Facility } = {};

  for (const facData of facilitiesToSeed) {
    let fac = await facilityRepo.findOneBy({ name: facData.name });
    if (!fac) {
      fac = facilityRepo.create(facData);
      await facilityRepo.save(fac);
      console.log(`[Seed] Created facility: ${facData.name}`);
    } else {
      // Update fields if it already exists to ensure new columns are populated
      Object.assign(fac, facData);
      await facilityRepo.save(fac);
      console.log(`[Seed] Updated facility: ${facData.name}`);
    }
    facilitiesMap[facData.name] = fac;
  }

  // 5. Seed Blocks
  const blocksToSeed = [
    { name: "Main Surgical Block", code: "CGH-BLK-A", totalLevels: 8, facilityName: "City General Hospital" },
    { name: "OPD Wing", code: "CGH-BLK-B", totalLevels: 4, facilityName: "City General Hospital" },
    { name: "Diagnostic Center", code: "RSC-BLK-01", totalLevels: 2, facilityName: "Riverside Specialty Clinic" },
    { name: "Cold Storage Block", code: "CMS-WH-B1", totalLevels: 1, facilityName: "Central Medical Stores" },
  ];

  for (const blkData of blocksToSeed) {
    let blk = await blockRepo.findOneBy({ code: blkData.code });
    if (!blk) {
      const facility = facilitiesMap[blkData.facilityName];
      if (facility) {
        blk = blockRepo.create({
          name: blkData.name,
          code: blkData.code,
          totalLevels: blkData.totalLevels,
          facility: facility,
          isActive: true,
        });
        await blockRepo.save(blk);
        console.log(`[Seed] Created block: ${blkData.name} linked to ${blkData.facilityName}`);
      }
    }
  }

  // 6. Seed Levels
  const levelRepo = AppDataSource.getRepository(Level);
  const levelsToSeed = [
    { name: "Level 1 - Surgery", code: "CGH-BLK-A-L1", blockCode: "CGH-BLK-A", isActive: true },
    { name: "Basement 1", code: "CGH-BLK-A-B1", blockCode: "CGH-BLK-A", isActive: true },
    { name: "Roof - Helipad", code: "RSC-BLK-01-RF", blockCode: "RSC-BLK-01", isActive: true },
    { name: "Ground Floor", code: "CGH-BLK-B-GF", blockCode: "CGH-BLK-B", isActive: false },
    { name: "Ground Floor", code: "RSC-BLK-01-GF", blockCode: "RSC-BLK-01", isActive: true },
    { name: "Basement 1", code: "CGH-BLK-B-B1", blockCode: "CGH-BLK-B", isActive: true },
  ];

  for (const lvlData of levelsToSeed) {
    let lvl = await levelRepo.findOneBy({ code: lvlData.code });
    if (!lvl) {
      const block = await blockRepo.findOneBy({ code: lvlData.blockCode });
      if (block) {
        lvl = levelRepo.create({
          name: lvlData.name,
          code: lvlData.code,
          block: block,
          isActive: lvlData.isActive,
        });
        await levelRepo.save(lvl);
        console.log(`[Seed] Created level: ${lvlData.name} linked to block ${lvlData.blockCode}`);
      }
    }
  }

  // 7. Seed Departments
  const deptRepo = AppDataSource.getRepository(Department);
  const deptsToSeed = [
    { name: "Cardiology", code: "CGH-CRD-001", levelCode: "CGH-BLK-A-L1", isActive: true },
    { name: "General Surgery", code: "CGH-SUR-002", levelCode: "CGH-BLK-A-L1", isActive: true },
    { name: "Radiology", code: "RSC-RAD-101", levelCode: "RSC-BLK-01-GF", isActive: true },
    { name: "Housekeeping", code: "CGH-HSK-B01", levelCode: "CGH-BLK-B-B1", isActive: false },
    { name: "Maintenance", code: "CGH-MNT-B02", levelCode: "CGH-BLK-B-B1", isActive: true },
  ];

  for (const deptData of deptsToSeed) {
    let dept = await deptRepo.findOneBy({ code: deptData.code });
    if (!dept) {
      const level = await levelRepo.findOneBy({ code: deptData.levelCode });
      if (level) {
        dept = deptRepo.create({
          name: deptData.name,
          code: deptData.code,
          level: level,
          isActive: deptData.isActive,
        });
        await deptRepo.save(dept);
        console.log(`[Seed] Created department: ${deptData.name} linked to level ${deptData.levelCode}`);
      }
    }
  }

  // 8. Seed User Locations
  const userLocationRepo = AppDataSource.getRepository(UserLocation);
  const userLocationsToSeed = [
    { username: "sjenkins", deptCode: "CGH-CRD-001" },
    { username: "mthompson", deptCode: "RSC-RAD-101" },
    { username: "jwilson", deptCode: "CGH-SUR-002" },
    { username: "erodriguez", deptCode: "CGH-MNT-B02" },
  ];

  for (const item of userLocationsToSeed) {
    const user = await userRepo.findOneBy({ username: item.username });
    const dept = await deptRepo.findOne({
      where: { code: item.deptCode },
      relations: { level: { block: { facility: true } } },
    });

    if (user && dept) {
      let mapping = await userLocationRepo.findOne({
        where: {
          user: { id: user.id },
          department: { id: dept.id },
        },
      });

      if (!mapping) {
        mapping = userLocationRepo.create({
          user,
          department: dept,
          level: dept.level,
          block: dept.level.block,
          facility: dept.level.block.facility,
        });
        await userLocationRepo.save(mapping);
        console.log(`[Seed] Mapped user ${user.username} to department ${dept.name}`);
      }
    }
  }

  // 9. Seed Asset Classifications
  const classificationRepo = AppDataSource.getRepository(AssetClassification);
  const classificationsToSeed = [
    {
      name: "Medical Equipment",
      code: "MED-EQP",
      description: "Clinical and surgical medical devices and instruments used for diagnosis, treatment, and monitoring.",
      totalAssetTypes: 142,
      isActive: true,
    },
    {
      name: "IT Assets",
      code: "IT-ASST",
      description: "Computers, servers, networking gear, and software applications supporting hospital operations.",
      totalAssetTypes: 86,
      isActive: true,
    },
    {
      name: "Facility Infrastructure",
      code: "FAC-INF",
      description: "HVAC, electrical systems, elevators, plumbing, and other structural systems.",
      totalAssetTypes: 34,
      isActive: true,
    },
    {
      name: "Furniture & Fixtures",
      code: "FUR-FIX",
      description: "Hospital beds, office furniture, lighting fixtures, and general patient room furnishings.",
      totalAssetTypes: 12,
      isActive: false,
    },
  ];

  for (const classData of classificationsToSeed) {
    let classification = await classificationRepo.findOneBy({ code: classData.code });
    if (!classification) {
      classification = classificationRepo.create(classData);
      await classificationRepo.save(classification);
      console.log(`[Seed] Created asset classification: ${classData.name}`);
    }
  }

  // 10. Seed Asset Types
  const assetTypeRepo = AppDataSource.getRepository(AssetType);
  const assetTypesToSeed = [
    {
      name: "MRI Scanner",
      code: "MED-MRI",
      description: "Magnetic Resonance Imaging diagnostic scanner for clinical imaging.",
      totalAssets: 12,
      isActive: true,
      classCode: "MED-EQP",
    },
    {
      name: "Laptop",
      code: "IT-LAP",
      description: "Portable computing devices for staff use and documentation.",
      totalAssets: 342,
      isActive: true,
      classCode: "IT-ASST",
    },
    {
      name: "Hospital Bed",
      code: "FUR-BED",
      description: "Adjustable medical beds for inpatient ward rooms.",
      totalAssets: 1250,
      isActive: true,
      classCode: "FUR-FIX",
    },
    {
      name: "Patient Monitor",
      code: "MED-MON",
      description: "Vital signs monitoring equipment for patient vitals tracking.",
      totalAssets: 84,
      isActive: false,
      classCode: "MED-EQP",
    },
    {
      name: "Ultrasound Machine",
      code: "MED-ULS",
      description: "Diagnostic ultrasound imaging system.",
      totalAssets: 28,
      isActive: true,
      classCode: "MED-EQP",
    },
    {
      name: "X-Ray System",
      code: "MED-XRY",
      description: "Digital radiography system for bone and chest imaging.",
      totalAssets: 8,
      isActive: true,
      classCode: "MED-EQP",
    },
    {
      name: "Ventilator",
      code: "MED-VEN",
      description: "Mechanical ventilator system for ICU and patient respiratory support.",
      totalAssets: 0,
      isActive: true,
      classCode: "MED-EQP",
    },
    {
      name: "Desktop PC",
      code: "IT-DSK",
      description: "Workstations for nurses and administration staff.",
      totalAssets: 512,
      isActive: true,
      classCode: "IT-ASST",
    },
    {
      name: "Server Rack",
      code: "IT-SVR",
      description: "Data center server racks and network switches.",
      totalAssets: 15,
      isActive: true,
      classCode: "IT-ASST",
    },
    {
      name: "Wheelchair",
      code: "FUR-WHL",
      description: "Manual and powered transport chairs for patients.",
      totalAssets: 120,
      isActive: true,
      classCode: "FUR-FIX",
    },
    {
      name: "IV Stand",
      code: "FUR-IVS",
      description: "Mobile intravenous infusion poles.",
      totalAssets: 450,
      isActive: true,
      classCode: "FUR-FIX",
    },
    {
      name: "Defibrillator",
      code: "MED-DFB",
      description: "Emergency cardiac resuscitation devices.",
      totalAssets: 32,
      isActive: true,
      classCode: "MED-EQP",
    },
    {
      name: "IP Phone",
      code: "IT-PHN",
      description: "VoIP phones for department-wide communication.",
      totalAssets: 620,
      isActive: true,
      classCode: "IT-ASST",
    },
    {
      name: "Examination Table",
      code: "FUR-EXT",
      description: "Adjustable patient examination tables for clinics.",
      totalAssets: 85,
      isActive: true,
      classCode: "FUR-FIX",
    },
    {
      name: "Office Chair",
      code: "FUR-OFC",
      description: "Ergonomic desk chairs for staff offices.",
      totalAssets: 220,
      isActive: true,
      classCode: "FUR-FIX",
    },
    {
      name: "Generator",
      code: "FAC-GEN",
      description: "Emergency backup diesel power generator systems.",
      totalAssets: 4,
      isActive: true,
      classCode: "FAC-INF",
    },
    {
      name: "Air Handler Unit",
      code: "FAC-AHU",
      description: "HVAC air handling and filtration systems.",
      totalAssets: 18,
      isActive: true,
      classCode: "FAC-INF",
    },
  ];

  for (const typeData of assetTypesToSeed) {
    let assetType = await assetTypeRepo.findOneBy({ code: typeData.code });
    if (!assetType) {
      const classification = await classificationRepo.findOneBy({ code: typeData.classCode });
      if (classification) {
        assetType = assetTypeRepo.create({
          name: typeData.name,
          code: typeData.code,
          description: typeData.description,
          totalAssets: typeData.totalAssets,
          isActive: typeData.isActive,
          classification,
        });
        await assetTypeRepo.save(assetType);
        console.log(`[Seed] Created asset type: ${typeData.name}`);
      }
    }
  }

  // 11. Seed Assets
  const assetRepo = AppDataSource.getRepository(Asset);

  const assetsToSeed = [
    {
      name: "Siemens Magnetom Skyra",
      model: "Skyra 3T",
      manufacturer: "Siemens Healthineers",
      serialNumber: "SN-99201-MRI",
      status: "ACTIVE",
      typeCode: "MED-MRI",
      facilityCode: "RSC-012",
      deptCode: "RSC-RAD-101",
    },
    {
      name: "Philips IntelliVue MX450",
      model: "MX450-V2",
      manufacturer: "Philips Healthcare",
      serialNumber: "MON-4482-PH",
      status: "UNDER_MAINTENANCE",
      typeCode: "MED-MON",
      facilityCode: "CGH-001",
      deptCode: "CGH-CRD-001",
    },
    {
      name: "GE Healthcare Voluson E10",
      model: "Voluson E10",
      manufacturer: "GE Healthcare",
      serialNumber: "GE-US-77812",
      status: "ACTIVE",
      typeCode: "MED-ULS",
      facilityCode: "CGH-001",
      deptCode: "CGH-SUR-002",
    },
    {
      name: "Dell Latitude 5420",
      model: "L5420-BK",
      manufacturer: "Dell Technologies",
      serialNumber: "DL-LT-B82910",
      status: "ACTIVE",
      typeCode: "IT-LAP",
      facilityCode: "CGH-001",
      deptCode: "CGH-MNT-B02",
    },
    {
      name: "Siemens Magnetom Prisma",
      model: "Prisma 3T",
      manufacturer: "Siemens Healthineers",
      serialNumber: "SN-77210-MRI",
      status: "ACTIVE",
      typeCode: "MED-MRI",
      facilityCode: "RSC-012",
      deptCode: "RSC-RAD-101",
    },
    {
      name: "HP EliteBook 840",
      model: "G8",
      manufacturer: "HP Inc.",
      serialNumber: "HP-LT-G80123",
      status: "ACTIVE",
      typeCode: "IT-LAP",
      facilityCode: "CGH-001",
      deptCode: "CGH-MNT-B02",
    },
    {
      name: "Stryker Secure II",
      model: "Secure II",
      manufacturer: "Stryker Corp",
      serialNumber: "STR-BD-11029",
      status: "ACTIVE",
      typeCode: "FUR-BED",
      facilityCode: "CGH-001",
      deptCode: "CGH-CRD-001",
    },
    {
      name: "Hill-Rom Progressa",
      model: "Progressa ICU",
      manufacturer: "Hill-Rom",
      serialNumber: "HR-BD-99881",
      status: "ACTIVE",
      typeCode: "FUR-BED",
      facilityCode: "CGH-001",
      deptCode: "CGH-CRD-001",
    },
    {
      name: "Mindray BeneVision N17",
      model: "BeneVision N17",
      manufacturer: "Mindray",
      serialNumber: "MON-8812-MN",
      status: "ACTIVE",
      typeCode: "MED-MON",
      facilityCode: "CGH-001",
      deptCode: "CGH-CRD-001",
    },
    {
      name: "Canon Aplio i800",
      model: "Aplio i800",
      manufacturer: "Canon Medical",
      serialNumber: "CAN-ULS-12983",
      status: "ACTIVE",
      typeCode: "MED-ULS",
      facilityCode: "RSC-012",
      deptCode: "RSC-RAD-101",
    },
    {
      name: "GE Optima XR220",
      model: "Optima XR220",
      manufacturer: "GE Healthcare",
      serialNumber: "GE-XRY-30012",
      status: "ACTIVE",
      typeCode: "MED-XRY",
      facilityCode: "CGH-001",
      deptCode: "CGH-SUR-002",
    },
    {
      name: "HP Z2 Mini",
      model: "Z2 G9",
      manufacturer: "HP Inc.",
      serialNumber: "HP-DSK-Z2001",
      status: "ACTIVE",
      typeCode: "IT-DSK",
      facilityCode: "CGH-001",
      deptCode: "CGH-MNT-B02",
    },
    {
      name: "Invacare Tracer EX2",
      model: "Tracer EX2",
      manufacturer: "Invacare",
      serialNumber: "INV-WHL-55102",
      status: "ACTIVE",
      typeCode: "FUR-WHL",
      facilityCode: "CGH-001",
      deptCode: "CGH-SUR-002",
    },
    {
      name: "Zoll R Series",
      model: "R Series Plus",
      manufacturer: "Zoll Medical",
      serialNumber: "ZOL-DFB-88310",
      status: "ACTIVE",
      typeCode: "MED-DFB",
      facilityCode: "CGH-001",
      deptCode: "CGH-CRD-001",
    },
    {
      name: "Cummins PowerGen",
      model: "C50D6",
      manufacturer: "Cummins",
      serialNumber: "CUM-GEN-44012",
      status: "ACTIVE",
      typeCode: "FAC-GEN",
      facilityCode: "CGH-001",
      deptCode: "CGH-MNT-B02",
    },
  ];

  for (const assetData of assetsToSeed) {
    let asset = await assetRepo.findOneBy({ serialNumber: assetData.serialNumber });
    if (!asset) {
      const assetType = await assetTypeRepo.findOneBy({ code: assetData.typeCode });
      const facility = await facilityRepo.findOneBy({ code: assetData.facilityCode });
      const department = await deptRepo.findOneBy({ code: assetData.deptCode });

      if (assetType && facility && department) {
        asset = assetRepo.create({
          name: assetData.name,
          model: assetData.model,
          manufacturer: assetData.manufacturer,
          serialNumber: assetData.serialNumber,
          status: assetData.status,
          assetType,
          facility,
          department,
        });
        await assetRepo.save(asset);

        // Update totalAssets on the type
        assetType.totalAssets = (assetType.totalAssets || 0) + 1;
        await assetTypeRepo.save(assetType);

        console.log(`[Seed] Seeded asset: ${assetData.name}`);
      }
    }
  }

  // 12. Seed PPM Checklists
  const checklistRepo = AppDataSource.getRepository(PpmChecklist);
  const checklistTaskRepo = AppDataSource.getRepository(PpmChecklistTask);

  const checklistsToSeed = [
    {
      name: "MRI Annual Safety Check",
      assetTypeCode: "MED-MRI",
      frequency: "Annual",
      isActive: true,
      notes: "Ensure rooms are completely swept for any ferromagnetic items before startup.",
      username: "sjenkins",
      updatedAt: "2024-05-20T10:00:00Z",
      tasks: [
        { description: "Verify liquid helium levels and pressure readings.", priority: "HIGH" },
        { description: "Inspect RF shielding and room integrity.", priority: "MEDIUM" },
        { description: "Clean external air filters and vents in the equipment room.", priority: "LOW" },
      ],
    },
    {
      name: "Patient Monitor Calibration",
      assetTypeCode: "MED-MON",
      frequency: "Monthly",
      isActive: true,
      notes: "Use verified fluke calibrators for accuracy checks.",
      username: "mross",
      updatedAt: "2024-04-12T09:30:00Z",
      tasks: [
        { description: "Verify ECG simulator readings.", priority: "HIGH" },
        { description: "Inspect NIBP cuffs and hoses for leaks.", priority: "MEDIUM" },
        { description: "Clean external chassis and verify battery health.", priority: "LOW" },
      ],
    },
    {
      name: "Ventilator Deep Clean & Verify",
      assetTypeCode: "MED-VEN",
      frequency: "Quarterly",
      isActive: false,
      notes: "Decontaminate thoroughly post deep cleaning.",
      username: "sjenkins",
      updatedAt: "2024-03-05T14:15:00Z",
      tasks: [
        { description: "Clean and sterilize internal exhalation valves.", priority: "HIGH" },
        { description: "Perform circuit leak test and compliance check.", priority: "HIGH" },
        { description: "Replace oxygen sensor and verify calibration.", priority: "MEDIUM" },
        { description: "Clean external surface and cooling fan filters.", priority: "LOW" },
      ],
    },
    {
      name: "X-Ray Tube Performance Test",
      assetTypeCode: "MED-XRY",
      frequency: "Semi-Annual",
      isActive: true,
      notes: "Perform dosimetry tests.",
      username: "acarter",
      updatedAt: "2024-02-14T11:00:00Z",
      tasks: [
        { description: "Perform collimator alignment and beam test.", priority: "HIGH" },
        { description: "Verify exposure timer accuracy.", priority: "HIGH" },
        { description: "Inspect exposure switch cord integrity.", priority: "MEDIUM" },
      ],
    },
  ];

  for (const listData of checklistsToSeed) {
    let checklist = await checklistRepo.findOneBy({ name: listData.name });
    if (!checklist) {
      const assetType = await assetTypeRepo.findOneBy({ code: listData.assetTypeCode });
      const user = await userRepo.findOneBy({ username: listData.username });

      if (assetType) {
        checklist = checklistRepo.create({
          name: listData.name,
          frequency: listData.frequency,
          isActive: listData.isActive,
          notes: listData.notes,
          assetType,
          lastModifiedBy: user || undefined,
          createdAt: new Date(listData.updatedAt),
          updatedAt: new Date(listData.updatedAt),
        });

        // Save checklist
        const savedList = await checklistRepo.save(checklist);

        // Force set timestamps as TypeORM sometimes overrides them on creation
        await checklistRepo.update(savedList.id, {
          createdAt: new Date(listData.updatedAt),
          updatedAt: new Date(listData.updatedAt),
        });

        // Save its tasks
        const tasks = listData.tasks.map((t, idx) =>
          checklistTaskRepo.create({
            description: t.description,
            priority: t.priority,
            orderIndex: idx,
            checklist: savedList,
          })
        );
        await checklistTaskRepo.save(tasks);

        console.log(`[Seed] Seeded PPM checklist: ${listData.name}`);
      }
    }
  }

  console.log("[Seed] Seeding completed successfully.");
}
