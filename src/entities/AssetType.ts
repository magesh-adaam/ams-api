import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AssetClassification } from "./AssetClassification";

@Entity("asset_types")
export class AssetType {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  code!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ default: 0 })
  totalAssets!: number;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => AssetClassification, (classification) => classification.assetTypes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "classification_id" })
  classification!: AssetClassification;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
