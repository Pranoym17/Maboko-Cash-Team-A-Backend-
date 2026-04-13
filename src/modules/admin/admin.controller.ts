import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AdminTransactionsQueryDto } from './dto/admin-transactions-query.dto';
import { AdminMobileMoneyQueryDto } from './dto/admin-mobile-money-query.dto';
import { AdminWalletsQueryDto } from './dto/admin-wallets-query.dto';
import { AdminLedgerQueryDto } from './dto/admin-ledger-query.dto';
import { AdminBankQueryDto } from './dto/admin-bank-query.dto';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { AdminMobileMoneyDecisionDto } from './dto/admin-mobile-money-decision.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('summary')
  getSummary() {
    return this.adminService.getSummary();
  }

  @Get('users')
  listUsers(@Query() query: AdminUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @Param('id') id: string,
    @Body() body: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, body.isActive);
  }

  @Get('users/:id/wallet')
  getUserWallet(@Param('id') id: string) {
    return this.adminService.getUserWallet(id);
  }

  @Get('users/:id/wallet-history')
  getUserWalletHistory(@Param('id') id: string) {
    return this.adminService.getUserWalletHistory(id);
  }

  @Get('users/:id/ledger')
  getUserLedger(@Param('id') id: string) {
    return this.adminService.getUserLedger(id);
  }

  @Get('users/:id/mobile-money')
  getUserMobileMoney(@Param('id') id: string) {
    return this.adminService.getUserMobileMoney(id);
  }

  @Get('users/:id/bank-accounts')
  getUserBankAccounts(@Param('id') id: string) {
    return this.adminService.getUserBankAccounts(id);
  }

  @Get('users/:id/bank-transfers')
  getUserBankTransfers(@Param('id') id: string) {
    return this.adminService.getUserBankTransfers(id);
  }

  @Get('users/:id/qrcode')
  getUserQRCode(@Param('id') id: string) {
    return this.adminService.getUserQRCode(id);
  }

  @Get('transactions')
  listTransactions(@Query() query: AdminTransactionsQueryDto) {
    return this.adminService.listTransactions(query);
  }

  @Get('transactions/:id')
  getTransactionDetail(@Param('id') id: string) {
    return this.adminService.getTransactionDetail(id);
  }

  @Post('transactions/:id/reverse')
  reverseTransaction(@Param('id') id: string) {
    return this.adminService.reverseTransaction(id);
  }

  @Get('mobile-money')
  listMobileMoney(@Query() query: AdminMobileMoneyQueryDto) {
    return this.adminService.listMobileMoney(query);
  }

  @Get('mobile-money/:id')
  getMobileMoney(@Param('id') id: string) {
    return this.adminService.getMobileMoney(id);
  }

  @Post('mobile-money/:id/approve')
  approveMobileMoney(
    @Param('id') id: string,
    @Body() body: AdminMobileMoneyDecisionDto,
  ) {
    return this.adminService.approveMobileMoney(id, body.message);
  }

  @Post('mobile-money/:id/reject')
  rejectMobileMoney(
    @Param('id') id: string,
    @Body() body: AdminMobileMoneyDecisionDto,
  ) {
    return this.adminService.rejectMobileMoney(id, body.message);
  }

  @Get('wallets')
  listWallets(@Query() query: AdminWalletsQueryDto) {
    return this.adminService.listWallets(query);
  }

  @Get('wallets/:walletId')
  getWallet(@Param('walletId') walletId: string) {
    return this.adminService.getWallet(walletId);
  }

  @Get('wallets/:walletId/history')
  getWalletHistory(@Param('walletId') walletId: string) {
    return this.adminService.getWalletHistory(walletId);
  }

  @Get('wallets/:walletId/ledger')
  getWalletLedger(@Param('walletId') walletId: string) {
    return this.adminService.getWalletLedger(walletId);
  }

  @Get('ledger')
  listLedger(@Query() query: AdminLedgerQueryDto) {
    return this.adminService.listLedger(query);
  }

  @Get('bank-transfers')
  listBankTransfers(@Query() query: AdminBankQueryDto) {
    return this.adminService.listBankTransfers(query);
  }

  @Get('bank-accounts')
  listBankAccounts(@Query() query: AdminListQueryDto) {
    return this.adminService.listBankAccounts(query);
  }
}
