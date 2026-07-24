import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { AssetType } from "./AssetType";
import { User } from "./User";
// Relational imports
import { PpmChecklistTask } from "./PpmChecklistTask";

@Entity("ppm_checklists")
export class PpmChecklist {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ type: "varchar", length: 50 })
  frequency!: string; // Annual, Semi-Annual, Quarterly, Monthly, Weekly, Daily

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => AssetType, { onDelete: "CASCADE" })
  @JoinColumn({ name: "asset_type_id" })
  assetType!: AssetType;

  @OneToMany(() => PpmChecklistTask, (task) => task.checklist, { cascade: true })
  tasks!: PpmChecklistTask[];

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "last_modified_by_id" })
  lastModifiedBy?: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
