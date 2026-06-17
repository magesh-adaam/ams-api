import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Facility } from "./Facility";

@Entity("blocks")
export class Block {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  code!: string;

  @Column({ default: 1 })
  totalLevels!: number;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => Facility, (facility) => facility.blocks, { onDelete: "CASCADE" })
  @JoinColumn({ name: "facility_id" })
  facility!: Facility;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
