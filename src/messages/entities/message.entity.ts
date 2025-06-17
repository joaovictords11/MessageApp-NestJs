import { User } from "src/users/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  content: string;

  // Muitos recados podem ser enviados por uma mesma pessoa
  @ManyToOne(() => User, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  // Especifica a coluna "from" que armazena o id do remetente
  @JoinColumn({ name: "from" })
  from: User;

  // Muitos recados podem ser enviados para uma mesma pessoa
  @ManyToOne(() => User, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  // Especifica a coluna "from" que armazena o id do remetente
  @JoinColumn({ name: "to" })
  to: User;

  @Column({ default: false })
  read: boolean;

  @Column()
  date: Date;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
