import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportConversation } from './entities/support-conversation.entity';
import { SupportMessage } from './entities/support-message.entity';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SupportConversation, SupportMessage])],
  providers: [SupportService],
  controllers: [SupportController],
  exports: [SupportService, TypeOrmModule],
})
export class SupportModule {}
