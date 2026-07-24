import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
// Relational imports
import { PpmChecklist } from "./PpmChecklist";

@Entity("ppm_checklist_tasks")
export class PpmChecklistTask {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 20, default: "MEDIUM" })
  priority!: string; // HIGH, MEDIUM, LOW

  @Column({ type: "integer", default: 0 })
  orderIndex!: number;

  @ManyToOne(() => PpmChecklist, (checklist: PpmChecklist) => checklist.tasks, { onDelete: "CASCADE" })
  @JoinColumn({ name: "checklist_id" })
  checklist!: PpmChecklist;
}
