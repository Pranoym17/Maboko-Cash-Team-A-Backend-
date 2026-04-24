import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { SupportMessage } from './support-message.entity';

@Entity('support_message_reads')
@Unique(['message', 'readerId', 'readerRole'])
export class SupportMessageRead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SupportMessage, { onDelete: 'CASCADE' })
  message: SupportMessage;

  @Column()
  readerId: string;

  @Column()
  readerRole: string;

  @CreateDateColumn()
  createdAt: Date;
}
