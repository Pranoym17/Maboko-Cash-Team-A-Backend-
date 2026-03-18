import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reference: string;

  @Column()
  senderUserId: string;

  @Column()
  receiverUserId: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: string;

  @Column({ default: 'CDF' })
  currency: string;

  @Column({ default: 'completed' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ default: 'peer_to_peer_transfer' })
  type: string;

  @Column({ type: 'varchar', length: 3, nullable: true })
  sourceCurrency?: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  sourceAmount?: string;

  @Column({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  fxRateSnapshot?: string;

  @Column({ type: 'varchar', nullable: true })
  fxProvider?: string;

  @Column({ type: 'timestamptz', nullable: true })
  fxTimestamp?: Date;

  @CreateDateColumn()
  createdAt: Date;
}