import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SupportService } from './support.service';
import { CreateSupportConversationDto } from './dto/create-support-conversation.dto';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('conversations')
  listMyConversations(@Req() req: any) {
    return this.supportService.listUserConversations(req.user.sub);
  }

  @Post('conversations')
  createConversation(@Req() req: any, @Body() body: CreateSupportConversationDto) {
    return this.supportService.createConversation(req.user.sub, body);
  }

  @Get('conversations/:id')
  getConversation(@Req() req: any, @Param('id') id: string) {
    return this.supportService.getConversationForUser(req.user.sub, id);
  }

  @Post('conversations/:id/messages')
  addMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: CreateSupportMessageDto,
  ) {
    return this.supportService.addMessageForUser(req.user.sub, id, body);
  }
}
