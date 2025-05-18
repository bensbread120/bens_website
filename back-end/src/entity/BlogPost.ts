import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class BlogPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: "text" })
  content: string;

  @Column({ length: 500 })
  excerpt: string;

  // Store image as binary
  @Column({ type: "longblob", nullable: true })
  image: Buffer;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
