import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AssetType } from "./AssetType";
import { Facility } from "./Facility";
import { Department } from "./Department";

@Entity("assets")
export class Asset {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column()
  model!: string;

  @Column()
  manufacturer!: string;

  @Column({ unique: true })
  serialNumber!: string;

  @Column({ default: "ACTIVE" })
  status!: string; // e.g. "ACTIVE", "UNDER_MAINTENANCE", "INACTIVE"

  @ManyToOne(() => AssetType, { onDelete: "CASCADE" })
  @JoinColumn({ name: "asset_type_id" })
  assetType!: AssetType;

  @ManyToOne(() => Facility, { onDelete: "CASCADE" })
  @JoinColumn({ name: "facility_id" })
  facility!: Facility;

  @ManyToOne(() => Department, { onDelete: "CASCADE" })
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
