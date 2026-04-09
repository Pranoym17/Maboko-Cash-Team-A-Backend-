import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MobileMoneyService } from './mobile-money.service';
import { MobileMoneyDepositDto } from './dto/mobile-money-deposit.dto';
import { MobileMoneyWithdrawDto } from './dto/mobile-money-withdraw.dto';
import { MobileMoneyCallbackDto } from './dto/mobile-money-callback.dto';

@ApiTags('Mobile Money')
@Controller('mobile-money')
export class MobileMoneyController {
  constructor(private readonly mobileMoneyService: MobileMoneyService) {}

  @Post('deposit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create simulated mobile money deposit request' })
  createDeposit(@Req() req: any, @Body() dto: MobileMoneyDepositDto) {
    return this.mobileMoneyService.createDeposit(req.user.sub, dto);
  }

  @Post('withdraw')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create simulated mobile money withdrawal request' })
  createWithdrawal(@Req() req: any, @Body() dto: MobileMoneyWithdrawDto) {
    return this.mobileMoneyService.createWithdrawal(req.user.sub, dto);
  }

  @Post('callback')
  @ApiOperation({ summary: 'Simulate telecom callback for mobile money request' })
  handleCallback(@Body() dto: MobileMoneyCallbackDto) {
    return this.mobileMoneyService.handleCallback(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my mobile money transactions' })
  listMine(@Req() req: any) {
    return this.mobileMoneyService.listMyTransactions(req.user.sub);
  }
}