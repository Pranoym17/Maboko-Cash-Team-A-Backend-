import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
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
import { UpdateAdminUserProfileDto } from './dto/update-admin-user-profile.dto';
import { AdminReferralsQueryDto } from './dto/admin-referrals-query.dto';
import { AdminRewardsQueryDto } from './dto/admin-rewards-query.dto';
import { UpdateReferralStatusDto } from './dto/update-referral-status.dto';
import { UpdateRewardStatusDto } from '../rewards/dto/update-reward-status.dto';
import { CreateRewardRuleDto } from '../rewards/dto/create-reward-rule.dto';
import { UpdateRewardRuleDto } from '../rewards/dto/update-reward-rule.dto';
import { AdminMarketplaceQueryDto } from './dto/admin-marketplace-query.dto';
import { CreateMarketplaceProviderDto } from '../marketplace/dto/create-marketplace-provider.dto';
import { UpdateMarketplaceProviderDto } from '../marketplace/dto/update-marketplace-provider.dto';
import { MarketplaceProviderStatus } from '../marketplace/enums/marketplace-provider-status.enum';
import { AdminSupportQueryDto } from './dto/admin-support-query.dto';
import { UpdateSupportAssignmentDto } from '../support/dto/update-support-assignment.dto';
import { UpdateSupportStatusDto } from '../support/dto/update-support-status.dto';
import { CreateSupportMessageDto } from '../support/dto/create-support-message.dto';

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

  @Patch('users/:id/profile')
  updateUserProfile(
    @Param('id') id: string,
    @Body() body: UpdateAdminUserProfileDto,
    @Req() req: any,
  ) {
    return this.adminService.updateUserProfile(id, body, req.user.sub);
  }

  @Post('users/:id/password-reset-link')
  generatePasswordResetLink(@Param('id') id: string, @Req() req: any) {
    return this.adminService.generatePasswordResetLink(id, req.user.sub);
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

  @Get('referrals')
  listReferrals(@Query() query: AdminReferralsQueryDto) {
    return this.adminService.listReferrals(query);
  }

  @Get('referrals/:userId')
  getReferralAnalytics(@Param('userId') userId: string) {
    return this.adminService.getReferralAnalytics(userId);
  }

  @Patch('referrals/:id/reject')
  rejectReferral(
    @Param('id') id: string,
    @Body() body: UpdateReferralStatusDto,
    @Req() req: any,
  ) {
    return this.adminService.rejectReferral(id, body.reason, req.user.sub);
  }

  @Patch('referrals/:id/flag-fraud')
  flagReferralFraud(
    @Param('id') id: string,
    @Body() body: UpdateReferralStatusDto,
    @Req() req: any,
  ) {
    return this.adminService.flagReferralFraud(id, body.reason, req.user.sub);
  }

  @Get('reward-rules')
  listRewardRules() {
    return this.adminService.listRewardRules();
  }

  @Post('reward-rules')
  createRewardRule(@Body() body: CreateRewardRuleDto, @Req() req: any) {
    return this.adminService.createRewardRule(body, req.user.sub);
  }

  @Patch('reward-rules/:id')
  updateRewardRule(
    @Param('id') id: string,
    @Body() body: UpdateRewardRuleDto,
    @Req() req: any,
  ) {
    return this.adminService.updateRewardRule(id, body, req.user.sub);
  }

  @Get('rewards')
  listRewards(@Query() query: AdminRewardsQueryDto) {
    return this.adminService.listRewards(query);
  }

  @Get('rewards/:id')
  getReward(@Param('id') id: string) {
    return this.adminService.getReward(id);
  }

  @Patch('rewards/:id/approve')
  approveReward(
    @Param('id') id: string,
    @Body() body: UpdateRewardStatusDto,
    @Req() req: any,
  ) {
    return this.adminService.approveReward(id, body.reason, req.user.sub);
  }

  @Patch('rewards/:id/reject')
  rejectReward(
    @Param('id') id: string,
    @Body() body: UpdateRewardStatusDto,
    @Req() req: any,
  ) {
    return this.adminService.rejectReward(id, body.reason, req.user.sub);
  }

  @Get('marketplace/providers')
  listMarketplaceProviders(@Query() query: AdminMarketplaceQueryDto) {
    return this.adminService.listMarketplaceProviders(query);
  }

  @Get('marketplace/categories')
  listMarketplaceCategories() {
    return this.adminService.listMarketplaceCategories();
  }

  @Post('marketplace/providers')
  createMarketplaceProvider(@Body() body: CreateMarketplaceProviderDto, @Req() req: any) {
    return this.adminService.createMarketplaceProvider(body, req.user.sub);
  }

  @Patch('marketplace/providers/:id')
  updateMarketplaceProvider(
    @Param('id') id: string,
    @Body() body: UpdateMarketplaceProviderDto,
    @Req() req: any,
  ) {
    return this.adminService.updateMarketplaceProvider(id, body, req.user.sub);
  }

  @Patch('marketplace/providers/:id/visibility')
  updateMarketplaceProviderVisibility(
    @Param('id') id: string,
    @Body() body: { isVisible: boolean },
    @Req() req: any,
  ) {
    return this.adminService.updateMarketplaceProviderVisibility(
      id,
      body.isVisible,
      req.user.sub,
    );
  }

  @Patch('marketplace/providers/:id/status')
  updateMarketplaceProviderStatus(
    @Param('id') id: string,
    @Body() body: { status: MarketplaceProviderStatus },
    @Req() req: any,
  ) {
    return this.adminService.updateMarketplaceProviderStatus(
      id,
      body.status,
      req.user.sub,
    );
  }

  @Get('support/conversations')
  listSupportConversations(@Query() query: AdminSupportQueryDto) {
    return this.adminService.listSupportConversations(query);
  }

  @Get('support/conversations/:id')
  getSupportConversation(@Param('id') id: string) {
    return this.adminService.getSupportConversation(id);
  }

  @Patch('support/conversations/:id/assign')
  assignSupportConversation(
    @Param('id') id: string,
    @Body() body: UpdateSupportAssignmentDto,
    @Req() req: any,
  ) {
    return this.adminService.assignSupportConversation(id, body, req.user.sub);
  }

  @Patch('support/conversations/:id/status')
  updateSupportConversationStatus(
    @Param('id') id: string,
    @Body() body: UpdateSupportStatusDto,
    @Req() req: any,
  ) {
    return this.adminService.updateSupportConversationStatus(id, body, req.user.sub);
  }

  @Post('support/conversations/:id/messages')
  addSupportConversationMessage(
    @Param('id') id: string,
    @Body() body: CreateSupportMessageDto,
    @Req() req: any,
  ) {
    return this.adminService.addSupportConversationMessage(id, body, req.user.sub);
  }
}
