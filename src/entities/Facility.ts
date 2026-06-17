import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Block } from "./Block";

@Entity("facilities")
export class Facility {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ unique: true, nullable: true })
  code?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  type?: string;

  @Column({ nullable: true })
  addressLine1?: string;

  @Column({ nullable: true })
  addressLine2?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  stateProvince?: string;

  @Column({ nullable: true })
  postcode?: string;

  @Column({ nullable: true })
  contactNumber?: string;

  @Column({ nullable: true })
  emailAddress?: string;

  @OneToMany(() => Block, (block) => block.facility)
  blocks!: Block[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
