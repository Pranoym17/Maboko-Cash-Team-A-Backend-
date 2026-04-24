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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/support',
})
export class SupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => SupportService))
    private readonly supportService: SupportService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const user = await this.supportService.authenticateSocket(client);
      client.user = user;
      client.join(`user:${user.sub}`);

      if (String(user.role).toLowerCase() === 'admin') {
        client.join('admins');
      }
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: AuthenticatedSocket) {}

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
    client.join(`conversation:${body.conversationId}`);
    const unread = await this.supportService.getUnreadCount(user.sub, user.role);
    client.emit('support:unread', unread);
    return { ok: true };
  }

  emitConversationUpdated(conversationId: string, payload: unknown) {
    this.server.to(`conversation:${conversationId}`).emit('support:conversation:updated', payload);
  }

  emitConversationCreated(payload: unknown, userId: string) {
    this.server.to(`user:${userId}`).emit('support:conversation:created', payload);
    this.server.to('admins').emit('support:conversation:created', payload);
  }

  async emitUnreadCount(userId: string, role: string) {
    const unread = await this.supportService.getUnreadCount(userId, role);
    if (String(role).toLowerCase() === 'admin') {
      this.server.to('admins').emit('support:unread', unread);
      return;
    }
    this.server.to(`user:${userId}`).emit('support:unread', unread);
  }
}
