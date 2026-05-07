import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ussd_transaction_requests')
export class UssdTransactionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  textHash: string;

  @Column({ type: 'varchar', unique: true })
  idempotencyKey: string;

  @Column({ type: 'varchar' })
  phoneNumber: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'completed' | 'failed';

  @Column({ type: 'text', nullable: true })
  response: string | null;

  @Column({ type: 'varchar', nullable: true })
  transactionReference: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
