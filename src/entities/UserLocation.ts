import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { User } from "./User";
import { Facility } from "./Facility";
import { Block } from "./Block";
import { Level } from "./Level";
import { Department } from "./Department";

@Entity("user_locations")
@Unique(["user", "department"])
export class UserLocation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Facility, { onDelete: "CASCADE" })
  @JoinColumn({ name: "facility_id" })
  facility!: Facility;

  @ManyToOne(() => Block, { onDelete: "CASCADE" })
  @JoinColumn({ name: "block_id" })
  block!: Block;

  @ManyToOne(() => Level, { onDelete: "CASCADE" })
  @JoinColumn({ name: "level_id" })
  level!: Level;

  @ManyToOne(() => Department, { onDelete: "CASCADE" })
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
