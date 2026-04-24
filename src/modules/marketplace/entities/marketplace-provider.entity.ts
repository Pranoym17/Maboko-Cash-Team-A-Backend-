import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MarketplaceCategory } from './marketplace-category.entity';
import { MarketplaceProviderStatus } from '../enums/marketplace-provider-status.enum';

@Entity('marketplace_providers')
export class MarketplaceProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @ManyToOne(() => MarketplaceCategory, (category) => category.providers, {
    onDelete: 'CASCADE',
  })
  category: MarketplaceCategory;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column()
  integrationType: string;

  @Column({ type: 'varchar', nullable: true })
  apiBaseUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  authType: string | null;

  @Column({
    type: 'enum',
    enum: MarketplaceProviderStatus,
    default: MarketplaceProviderStatus.PENDING,
  })
  status: MarketplaceProviderStatus;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ default: false })
  supportsAccountLinking: boolean;

  @Column({ type: 'int', default: 2 })
  averageConfirmationSeconds: number;

  @Column({ type: 'simple-json', nullable: true })
  metadataJson: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
