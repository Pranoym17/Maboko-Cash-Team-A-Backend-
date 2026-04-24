import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SupportConversation } from './entities/support-conversation.entity';
import { SupportMessage } from './entities/support-message.entity';
import { CreateSupportConversationDto } from './dto/create-support-conversation.dto';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';
import { SupportSenderRole } from './enums/support-sender-role.enum';
import { SupportMessageType } from './enums/support-message-type.enum';
import { UpdateSupportStatusDto } from './dto/update-support-status.dto';
import { UpdateSupportAssignmentDto } from './dto/update-support-assignment.dto';
import { AdminSupportQueryDto } from '../admin/dto/admin-support-query.dto';
import { SupportConversationStatus } from './enums/support-conversation-status.enum';
import { SupportPriority } from './enums/support-priority.enum';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportConversation)
    private readonly conversationsRepository: Repository<SupportConversation>,
    @InjectRepository(SupportMessage)
    private readonly messagesRepository: Repository<SupportMessage>,
  ) {}

  async createConversation(userId: string, body: CreateSupportConversationDto) {
    const conversation = await this.conversationsRepository.save(
      this.conversationsRepository.create({
        userId,
        assignedAdminId: null,
        subject: body.subject,
        category: body.category,
        priority: body.priority ?? SupportPriority.MEDIUM,
        status: SupportConversationStatus.OPEN,
        lastMessageAt: new Date(),
      }),
    );

    await this.messagesRepository.save(
      this.messagesRepository.create({
        conversation,
        senderUserId: userId,
        senderAdminId: null,
        senderRole: SupportSenderRole.USER,
        message: body.message,
        messageType: SupportMessageType.TEXT,
        isInternalNote: false,
      }),
    );

    return this.getConversationForUser(userId, conversation.id);
  }

  async listUserConversations(userId: string) {
    return this.conversationsRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async getConversationForUser(userId: string, conversationId: string) {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId, userId },
      relations: { messages: true },
      order: { messages: { createdAt: 'ASC' } },
    });

    if (!conversation) {
      throw new NotFoundException('Support conversation not found');
    }

    return {
      ...conversation,
      messages: conversation.messages.filter((message) => !message.isInternalNote),
    };
  }

  async addMessageForUser(
    userId: string,
    conversationId: string,
    body: CreateSupportMessageDto,
  ) {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Support conversation not found');
    }

    await this.messagesRepository.save(
      this.messagesRepository.create({
        conversation,
        senderUserId: userId,
        senderAdminId: null,
        senderRole: SupportSenderRole.USER,
        message: body.message,
        messageType: SupportMessageType.TEXT,
        isInternalNote: false,
      }),
    );

    conversation.lastMessageAt = new Date();
    if (conversation.status === SupportConversationStatus.RESOLVED) {
      conversation.status = SupportConversationStatus.OPEN;
      conversation.resolvedAt = null;
    }
    await this.conversationsRepository.save(conversation);
    return this.getConversationForUser(userId, conversationId);
  }

  async listAdminConversations(query: AdminSupportQueryDto) {
    const qb = this.conversationsRepository
      .createQueryBuilder('conversation')
      .orderBy('conversation.updatedAt', 'DESC');

    if (query.search) {
      qb.andWhere(
        '(conversation.subject ILIKE :search OR CAST(conversation.userId AS text) ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.status) {
      qb.andWhere('conversation.status = :status', { status: query.status });
    }

    if (query.category) {
      qb.andWhere('conversation.category = :category', {
        category: query.category,
      });
    }

    if (query.userId) {
      qb.andWhere('conversation.userId = :userId', { userId: query.userId });
    }

    return this.paginate(qb, query.page ?? 1, query.limit ?? 20);
  }

  async getConversationForAdmin(conversationId: string) {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
      relations: { messages: true },
      order: { messages: { createdAt: 'ASC' } },
    });

    if (!conversation) {
      throw new NotFoundException('Support conversation not found');
    }

    return conversation;
  }

  async addMessageForAdmin(
    adminUserId: string,
    conversationId: string,
    body: CreateSupportMessageDto,
  ) {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Support conversation not found');
    }

    if (body.isInternalNote && conversation.assignedAdminId && conversation.assignedAdminId !== adminUserId) {
      throw new ForbiddenException('Only the assigned admin can add internal notes');
    }

    await this.messagesRepository.save(
      this.messagesRepository.create({
        conversation,
        senderUserId: null,
        senderAdminId: adminUserId,
        senderRole: SupportSenderRole.ADMIN,
        message: body.message,
        messageType: SupportMessageType.TEXT,
        isInternalNote: body.isInternalNote ?? false,
      }),
    );

    conversation.lastMessageAt = new Date();
    await this.conversationsRepository.save(conversation);
    return this.getConversationForAdmin(conversationId);
  }

  async assignConversation(
    conversationId: string,
    body: UpdateSupportAssignmentDto,
    adminUserId: string,
  ) {
    const conversation = await this.getConversationForAdmin(conversationId);
    conversation.assignedAdminId = body.assignedAdminId ?? adminUserId;
    return this.conversationsRepository.save(conversation);
  }

  async updateConversationStatus(
    conversationId: string,
    body: UpdateSupportStatusDto,
    adminUserId: string,
  ) {
    const conversation = await this.getConversationForAdmin(conversationId);
    conversation.status = body.status;

    if (body.status === SupportConversationStatus.RESOLVED) {
      conversation.resolvedAt = new Date();
    }

    if (body.status === SupportConversationStatus.ESCALATED) {
      conversation.escalatedAt = new Date();
    }

    const savedConversation = await this.conversationsRepository.save(conversation);

    if (body.note) {
      await this.messagesRepository.save(
        this.messagesRepository.create({
          conversation: savedConversation,
          senderUserId: null,
          senderAdminId: adminUserId,
          senderRole: SupportSenderRole.SYSTEM,
          message: body.note,
          messageType: SupportMessageType.SYSTEM_EVENT,
          isInternalNote: true,
        }),
      );
    }

    return this.getConversationForAdmin(conversationId);
  }

  private async paginate(
    qb: SelectQueryBuilder<SupportConversation>,
    page: number,
    limit: number,
  ) {
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }
}
