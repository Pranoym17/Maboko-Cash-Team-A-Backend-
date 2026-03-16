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

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'peer_to_peer_transfer' })
  type: string;

  @CreateDateColumn()
  createdAt: Date;
}