import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAuditLog } from './entities/admin-audit-log.entity';

interface LogAdminActionInput {
  adminUserId: string;
  actionType: string;
  targetEntity: string;
  targetEntityId: string;
  beforeJson?: Record<string, unknown> | null;
  afterJson?: Record<string, unknown> | null;
  metadataJson?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AdminAuditLog)
    private readonly auditLogsRepository: Repository<AdminAuditLog>,
  ) {}

  async logAdminAction(input: LogAdminActionInput) {
    const auditLog = this.auditLogsRepository.create({
      adminUserId: input.adminUserId,
      actionType: input.actionType,
      targetEntity: input.targetEntity,
      targetEntityId: input.targetEntityId,
      beforeJson: input.beforeJson ?? null,
      afterJson: input.afterJson ?? null,
      metadataJson: input.metadataJson ?? null,
    });

    return this.auditLogsRepository.save(auditLog);
  }
}
