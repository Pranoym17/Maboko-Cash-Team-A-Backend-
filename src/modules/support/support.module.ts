import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportConversation } from './entities/support-conversation.entity';
import { SupportMessage } from './entities/support-message.entity';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { SupportGateway } from './support.gateway';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SupportMessageRead } from './entities/support-message-read.entity';
import { WsJwtAuthGuard } from './ws-jwt-auth.guard';

@Module({
  imports: [
    ConfigModule,
    JwtModule,
    TypeOrmModule.forFeature([SupportConversation, SupportMessage, SupportMessageRead]),
  ],
  providers: [SupportService, SupportGateway, WsJwtAuthGuard],
  controllers: [SupportController],
  exports: [SupportService, SupportGateway, TypeOrmModule],
})
export class SupportModule {}
