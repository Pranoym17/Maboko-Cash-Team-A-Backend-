import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../../common/enums/role.enum';
import { Wallet } from '../../wallets/entities/wallet.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  fullName: string;

  @Column()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', unique: true, nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  ussdPinHash: string | null;

  @Column({ default: false })
  ussdEnabled: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  ussdPinUpdatedAt: Date | null;

  @Column({ default: 0 })
  ussdFailedPinAttempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  ussdLockedUntil: Date | null;

  @Column({ type: 'text', nullable: true })
  qrCode: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  referralCode: string | null;

  @Column({ type: 'varchar', nullable: true })
  referredByUserId: string | null;

  @Column({ type: 'varchar', nullable: true })
  passwordResetToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetExpiresAt: Date | null;

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
