import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
import { SupportGateway } from './support.gateway';
import { SupportMessageRead } from './entities/support-message-read.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportConversation)
    private readonly conversationsRepository: Repository<SupportConversation>,
    @InjectRepository(SupportMessage)
    private readonly messagesRepository: Repository<SupportMessage>,
    @InjectRepository(SupportMessageRead)
    private readonly readsRepository: Repository<SupportMessageRead>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => SupportGateway))
    private readonly supportGateway: SupportGateway,
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

    const fullConversation = await this.getConversationForUser(userId, conversation.id);
    this.supportGateway.emitConversationCreated(fullConversation, userId);
    await this.supportGateway.emitUnreadCount(userId, SupportSenderRole.USER);
    await this.emitUnreadCountsForAdmins();
    return fullConversation;
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

    await this.markConversationRead(conversationId, userId, SupportSenderRole.USER);

    const result = {
      ...conversation,
      messages: conversation.messages.filter((message) => !message.isInternalNote),
    };
    await this.supportGateway.emitUnreadCount(userId, SupportSenderRole.USER);
    return result;
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
    const fullConversation = await this.getConversationForUser(userId, conversationId);
    await this.emitConversationUpdate(conversationId, conversation.userId);
    await this.supportGateway.emitUnreadCount(userId, SupportSenderRole.USER);
    await this.emitUnreadCountsForAdmins();
    return fullConversation;
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

  async getConversationForAdmin(conversationId: string, adminUserId?: string) {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
      relations: { messages: true },
      order: { messages: { createdAt: 'ASC' } },
    });

    if (!conversation) {
      throw new NotFoundException('Support conversation not found');
    }

    if (adminUserId) {
      await this.markConversationRead(conversationId, adminUserId, SupportSenderRole.ADMIN);
      await this.supportGateway.emitUnreadCount(adminUserId, SupportSenderRole.ADMIN);
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

    if (
      body.isInternalNote &&
      conversation.assignedAdminId &&
      conversation.assignedAdminId !== adminUserId
    ) {
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
    const fullConversation = await this.getConversationForAdmin(conversationId, adminUserId);
    await this.emitConversationUpdate(conversationId, conversation.userId);
    await this.supportGateway.emitUnreadCount(conversation.userId, SupportSenderRole.USER);
    await this.emitUnreadCountsForAdmins();
    return fullConversation;
  }

  async assignConversation(
    conversationId: string,
    body: UpdateSupportAssignmentDto,
    adminUserId: string,
  ) {
    const conversation = await this.getConversationForAdmin(conversationId, adminUserId);
    conversation.assignedAdminId = body.assignedAdminId ?? adminUserId;
    const savedConversation = await this.conversationsRepository.save(conversation);
    await this.emitConversationUpdate(conversationId, savedConversation.userId);
    return savedConversation;
  }

  async updateConversationStatus(
    conversationId: string,
    body: UpdateSupportStatusDto,
    adminUserId: string,
  ) {
    const conversation = await this.getConversationForAdmin(conversationId, adminUserId);
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

    const fullConversation = await this.getConversationForAdmin(conversationId, adminUserId);
    await this.emitConversationUpdate(conversationId, conversation.userId);
    await this.supportGateway.emitUnreadCount(conversation.userId, SupportSenderRole.USER);
    await this.emitUnreadCountsForAdmins();
    return fullConversation;
  }

  async authenticateSocket(client: {
    handshake: { auth?: { token?: string }; headers?: { authorization?: string } };
  }) {
    const bearerToken =
      client.handshake.auth?.token ??
      client.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

    if (!bearerToken) {
      throw new ForbiddenException('Missing websocket token');
    }

    return this.jwtService.verifyAsync(bearerToken, {
      secret: this.configService.get<string>('JWT_SECRET') as string,
    });
  }

  async assertSocketConversationAccess(userId: string, role: string, conversationId: string) {
    if (String(role).toLowerCase() === 'admin') {
      await this.getConversationForAdmin(conversationId, userId);
      return;
    }

    await this.getConversationForUser(userId, conversationId);
  }

  async getUnreadCount(userId: string, role: string) {
    const roleKey =
      String(role).toLowerCase() === 'admin'
        ? SupportSenderRole.ADMIN
        : SupportSenderRole.USER;

    const conversations = await this.conversationsRepository.find({
      where: roleKey === SupportSenderRole.USER ? { userId } : {},
      relations: { messages: true },
    });

    const reads = await this.readsRepository.find({
      where: {
        readerId: userId,
        readerRole: roleKey,
      },
      relations: { message: true },
    });
    const readIds = new Set(reads.map((entry) => entry.message.id));

    let unreadCount = 0;

    for (const conversation of conversations) {
      const relevantMessages = conversation.messages.filter((message) => {
        if (message.isInternalNote) {
          return false;
        }

        if (roleKey === SupportSenderRole.USER) {
          return message.senderRole !== SupportSenderRole.USER;
        }

        return message.senderRole === SupportSenderRole.USER;
      });

      unreadCount += relevantMessages.filter((message) => !readIds.has(message.id)).length;
    }

    return { unreadCount };
  }

  async markConversationRead(conversationId: string, readerId: string, readerRole: string) {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
      relations: { messages: true },
    });

    if (!conversation) {
      throw new NotFoundException('Support conversation not found');
    }

    const targetMessages = conversation.messages.filter((message) => {
      if (message.isInternalNote && readerRole !== SupportSenderRole.ADMIN) {
        return false;
      }

      if (readerRole === SupportSenderRole.USER) {
        return message.senderRole !== SupportSenderRole.USER;
      }

      return message.senderRole === SupportSenderRole.USER;
    });

    const existingReads = await this.readsRepository.find({
      where: { readerId, readerRole },
      relations: { message: true },
    });
    const existingIds = new Set(existingReads.map((item) => item.message.id));

    const newReads = targetMessages
      .filter((message) => !existingIds.has(message.id))
      .map((message) =>
        this.readsRepository.create({
          message,
          readerId,
          readerRole,
        }),
      );

    if (newReads.length > 0) {
      await this.readsRepository.save(newReads);
    }
  }

  private async emitUnreadCountsForAdmins() {
    const admins = await this.usersRepository.find({
      where: { role: Role.ADMIN, isActive: true },
      select: ['id'],
    });

    await Promise.all(
      admins.map((admin) =>
        this.supportGateway.emitUnreadCount(admin.id, SupportSenderRole.ADMIN),
      ),
    );
  }

  private async emitConversationUpdate(conversationId: string, userId: string) {
    const adminConversation = await this.getConversationForAdmin(conversationId);
    const userConversation = await this.getConversationForUser(userId, conversationId);
    this.supportGateway.emitConversationUpdated(
      conversationId,
      userId,
      adminConversation,
      userConversation,
    );
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
