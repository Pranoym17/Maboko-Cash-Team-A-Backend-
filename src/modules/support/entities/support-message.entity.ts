import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SupportConversation } from './support-conversation.entity';
import { SupportMessageType } from '../enums/support-message-type.enum';
import { SupportSenderRole } from '../enums/support-sender-role.enum';

@Entity('support_messages')
export class SupportMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SupportConversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  conversation: SupportConversation;

  @Column({ type: 'varchar', nullable: true })
  senderUserId: string | null;

  @Column({ type: 'varchar', nullable: true })
  senderAdminId: string | null;

  @Column({
    type: 'enum',
    enum: SupportSenderRole,
  })
  senderRole: SupportSenderRole;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: SupportMessageType,
    default: SupportMessageType.TEXT,
  })
  messageType: SupportMessageType;

  @Column({ default: false })
  isInternalNote: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
