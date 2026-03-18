import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fx_rates')
@Unique(['baseCurrency', 'quoteCurrency'])
export class FxRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 3 })
  baseCurrency: string;

  @Column({ length: 3, default: 'CDF' })
  quoteCurrency: string;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  rate: string;

  @Column({ default: 'ExchangeRate-API' })
  provider: string;

  @Column({ default: false })
  isManual: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  sourceLastUpdatedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  sourceNextUpdateAt: Date | null;

  @Column({ type: 'timestamptz' })
  fetchedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}