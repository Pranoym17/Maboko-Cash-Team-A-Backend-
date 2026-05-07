import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Inject, UseGuards, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SupportService } from './support.service';
import { WsJwtAuthGuard } from './ws-jwt-auth.guard';

type AuthenticatedSocket = Socket & {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
};

type SocketUser = NonNullable<AuthenticatedSocket['user']>;

@WebSocketGateway({
  cors: {
    origin: process.env.WS_CORS_ORIGINS?.split(',').map((origin) =>
      origin.trim(),
    ) ?? ['http://localhost:3000', 'http://localhost:3001'],
  },
  namespace: '/support',
})
export class SupportGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => SupportService))
    private readonly supportService: SupportService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const user = (await this.supportService.authenticateSocket(
        client,
      )) as SocketUser;
      client.user = user;
      void client.join(`user:${user.sub}`);

      if (String(user.role).toLowerCase() === 'admin') {
        void client.join('admins');
      }
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect() {}

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('support:join')
  async joinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId: string },
  ) {
    const user = client.user!;
    await this.supportService.assertSocketConversationAccess(
      user.sub,
      user.role,
      body.conversationId,
    );

    if (String(user.role).toLowerCase() === 'admin') {
      void client.join(`conversation:${body.conversationId}:admins`);
    } else {
      void client.join(`conversation:${body.conversationId}:user:${user.sub}`);
    }

    const unread = await this.supportService.getUnreadCount(
      user.sub,
      user.role,
    );
    client.emit('support:unread', unread);
    return { ok: true };
  }

  emitConversationUpdated(
    conversationId: string,
    userId: string,
    adminPayload: unknown,
    userPayload: unknown,
  ) {
    this.server
      .to(`conversation:${conversationId}:admins`)
      .emit('support:conversation:updated', adminPayload);
    this.server
      .to(`conversation:${conversationId}:user:${userId}`)
      .emit('support:conversation:updated', userPayload);
  }

  emitConversationCreated(payload: unknown, userId: string) {
    this.server
      .to(`user:${userId}`)
      .emit('support:conversation:created', payload);
    this.server.to('admins').emit('support:conversation:created', payload);
  }

  async emitUnreadCount(userId: string, role: string) {
    const unread = await this.supportService.getUnreadCount(userId, role);
    this.server.to(`user:${userId}`).emit('support:unread', unread);
  }
}
