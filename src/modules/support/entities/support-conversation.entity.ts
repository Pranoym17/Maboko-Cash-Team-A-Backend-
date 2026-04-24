import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SupportCategory } from '../enums/support-category.enum';
import { SupportConversationStatus } from '../enums/support-conversation-status.enum';
import { SupportPriority } from '../enums/support-priority.enum';
import { SupportMessage } from './support-message.entity';

@Entity('support_conversations')
export class SupportConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  assignedAdminId: string | null;

  @Column()
  subject: string;

  @Column({
    type: 'enum',
    enum: SupportCategory,
    default: SupportCategory.OTHER,
  })
  category: SupportCategory;

  @Column({
    type: 'enum',
    enum: SupportConversationStatus,
    default: SupportConversationStatus.OPEN,
  })
  status: SupportConversationStatus;

  @Column({
    type: 'enum',
    enum: SupportPriority,
    default: SupportPriority.MEDIUM,
  })
  priority: SupportPriority;

  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  escalatedAt: Date | null;

  @OneToMany(() => SupportMessage, (message) => message.conversation)
  messages: SupportMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
