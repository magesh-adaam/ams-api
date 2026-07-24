import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { AssetType } from "./AssetType";

@Entity("asset_classifications")
export class AssetClassification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  code!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ default: 0 })
  totalAssetTypes!: number;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => AssetType, (type) => type.classification)
  assetTypes!: AssetType[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
