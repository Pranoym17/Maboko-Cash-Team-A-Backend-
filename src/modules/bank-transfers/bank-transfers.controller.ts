import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BankTransfersService } from './bank-transfers.service';
import { LinkBankAccountDto } from './dto/link-bank-account.dto';
import { CreateBankTransferDto } from './dto/create-bank-transfer.dto';

@ApiTags('Bank Transfers')
@Controller('bank-transfers')
export class BankTransfersController {
  constructor(private readonly bankTransfersService: BankTransfersService) {}

  @Post('accounts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link a simulated bank account' })
  linkBankAccount(@Req() req: any, @Body() dto: LinkBankAccountDto) {
    return this.bankTransfersService.linkBankAccount(req.user.sub, dto);
  }

  @Get('accounts/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my linked bank accounts' })
  listMyBankAccounts(@Req() req: any) {
    return this.bankTransfersService.listMyBankAccounts(req.user.sub);
  }

  @Post('transfer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Simulate wallet to bank transfer' })
  createTransfer(@Req() req: any, @Body() dto: CreateBankTransferDto) {
    return this.bankTransfersService.createWalletToBankTransfer(req.user.sub, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my simulated bank transfers' })
  listMyTransfers(@Req() req: any) {
    return this.bankTransfersService.listMyTransfers(req.user.sub);
  }
}