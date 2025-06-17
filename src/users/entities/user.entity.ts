import { IsEmail } from "class-validator";
import { Message } from "src/messages/entities/message.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column({ type: "varchar", length: 255 })
  passwordHash: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  // Uma pessoa pode ter enviado muitos recados ( como "from" )
  // Esses recados são relacionados ao campo "from" na entidade Message
  @OneToMany(() => Message, (message) => message.from)
  messagesSent: Message[];

  // Uma pessoa pode ter recebido muitos recados ( como "to" )
  // Esses recados são relacionados ao campo "to" na entidade Message
  @OneToMany(() => Message, (message) => message.to)
  messagesReceived: Message[];

  @Column({ default: true })
  active: boolean;

  @Column({ default: "" })
  picture: string;

  // @Column({ type: "simple-array", default: [] })
  // routePolicies: RoutePolicies[];
}
