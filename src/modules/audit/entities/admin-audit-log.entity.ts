import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('admin_audit_logs')
export class AdminAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  adminUserId: string;

  @Column()
  actionType: string;

  @Column()
  targetEntity: string;

  @Column()
  targetEntityId: string;

  @Column({ type: 'simple-json', nullable: true })
  beforeJson: Record<string, unknown> | null;

  @Column({ type: 'simple-json', nullable: true })
  afterJson: Record<string, unknown> | null;

  @Column({ type: 'simple-json', nullable: true })
  metadataJson: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
