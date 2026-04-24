import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletTransaction } from '../wallets/entities/wallet-transaction.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { LedgerEntry } from '../ledger/entities/ledger-entry.entity';
import { MobileMoneyTransaction } from '../mobile-money/entities/mobile-money-transaction.entity';
import { BankTransfer } from '../bank-transfers/entities/bank-transfer.entity';
import { BankAccount } from '../bank-transfers/entities/bank-account.entity';
import { FxRate } from '../fx/entities/fx-rate.entity';
import { MobileMoneyStatus } from '../mobile-money/enums/mobile-money-status.enum';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { MobileMoneyService } from '../mobile-money/mobile-money.service';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { AdminTransactionsQueryDto } from './dto/admin-transactions-query.dto';
import { AdminMobileMoneyQueryDto } from './dto/admin-mobile-money-query.dto';
import { AdminLedgerQueryDto } from './dto/admin-ledger-query.dto';
import { AdminBankQueryDto } from './dto/admin-bank-query.dto';
import { AdminWalletsQueryDto } from './dto/admin-wallets-query.dto';
import { TransactionStatus } from '../transactions/enums/transaction-status.enum';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { ReferralsService } from '../referrals/referrals.service';
import { RewardsService } from '../rewards/rewards.service';
import { AdminReferralsQueryDto } from './dto/admin-referrals-query.dto';
import { AdminRewardsQueryDto } from './dto/admin-rewards-query.dto';
import { UpdateAdminUserProfileDto } from './dto/update-admin-user-profile.dto';
import { AuditService } from '../audit/audit.service';
import { randomUUID } from 'crypto';
import { CreateRewardRuleDto } from '../rewards/dto/create-reward-rule.dto';
import { UpdateRewardRuleDto } from '../rewards/dto/update-reward-rule.dto';
import { Referral } from '../referrals/entities/referral.entity';
import { ReferralReward } from '../rewards/entities/referral-reward.entity';
import { ReferralStatus } from '../referrals/enums/referral-status.enum';
import { RewardStatus } from '../rewards/enums/reward-status.enum';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { SupportService } from '../support/support.service';
import { AdminMarketplaceQueryDto } from './dto/admin-marketplace-query.dto';
import { CreateMarketplaceProviderDto } from '../marketplace/dto/create-marketplace-provider.dto';
import { UpdateMarketplaceProviderDto } from '../marketplace/dto/update-marketplace-provider.dto';
import { MarketplaceProviderStatus } from '../marketplace/enums/marketplace-provider-status.enum';
import { AdminSupportQueryDto } from './dto/admin-support-query.dto';
import { UpdateSupportAssignmentDto } from '../support/dto/update-support-assignment.dto';
import { UpdateSupportStatusDto } from '../support/dto/update-support-status.dto';
import { CreateSupportMessageDto } from '../support/dto/create-support-message.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Wallet)
    private readonly walletsRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly walletTransactionsRepository: Repository<WalletTransaction>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerRepository: Repository<LedgerEntry>,
    @InjectRepository(MobileMoneyTransaction)
    private readonly mobileMoneyRepository: Repository<MobileMoneyTransaction>,
    @InjectRepository(BankTransfer)
    private readonly bankTransfersRepository: Repository<BankTransfer>,
    @InjectRepository(BankAccount)
    private readonly bankAccountsRepository: Repository<BankAccount>,
    @InjectRepository(FxRate)
    private readonly fxRatesRepository: Repository<FxRate>,
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
    @InjectRepository(ReferralReward)
    private readonly referralRewardsRepository: Repository<ReferralReward>,
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
    private readonly mobileMoneyService: MobileMoneyService,
    private readonly referralsService: ReferralsService,
    private readonly rewardsService: RewardsService,
    private readonly auditService: AuditService,
    private readonly marketplaceService: MarketplaceService,
    private readonly supportService: SupportService,
  ) {}

  async getSummary() {
    const [
      totalUsers,
      totalWallets,
      totalTransactions,
      totalWalletBalanceRaw,
      pendingMobileMoney,
      completedMobileMoney,
      failedMobileMoney,
      totalReferrals,
      activeReferrals,
      fraudFlaggedReferrals,
      pendingRewards,
      creditedRewardsRaw,
      recentTransactions,
      recentReversals,
      recentWalletActivity,
      fxSnapshot,
    ] = await Promise.all([
      this.usersRepository.count(),
      this.walletsRepository.count(),
      this.transactionsRepository.count(),
      this.walletsRepository
        .createQueryBuilder('wallet')
        .select('COALESCE(SUM(wallet.balance), 0)', 'sum')
        .getRawOne<{ sum: string }>(),
      this.mobileMoneyRepository.count({
        where: { status: MobileMoneyStatus.PENDING },
      }),
      this.mobileMoneyRepository.count({
        where: { status: MobileMoneyStatus.COMPLETED },
      }),
      this.mobileMoneyRepository.count({
        where: { status: MobileMoneyStatus.FAILED },
      }),
      this.referralsRepository.count(),
      this.referralsRepository.count({
        where: [
          { status: ReferralStatus.ACTIVE },
          { status: ReferralStatus.REWARD_PENDING },
          { status: ReferralStatus.REWARDED },
        ],
      }),
      this.referralsRepository.count({
        where: { fraudFlag: true },
      }),
      this.referralRewardsRepository.count({
        where: { status: RewardStatus.PENDING },
      }),
      this.referralRewardsRepository
        .createQueryBuilder('reward')
        .select('COALESCE(SUM(reward."amountCDF"), 0)', 'sum')
        .where('reward.status = :status', { status: RewardStatus.CREDITED })
        .getRawOne<{ sum: string }>(),
      this.transactionsRepository.find({
        order: { createdAt: 'DESC' },
        take: 8,
      }),
      this.transactionsRepository.find({
        where: { status: TransactionStatus.REVERSED },
        order: { createdAt: 'DESC' },
        take: 8,
      }),
      this.walletTransactionsRepository.find({
        relations: { wallet: { user: true } },
        order: { createdAt: 'DESC' },
        take: 8,
      }),
      this.fxRatesRepository.find({
        order: { fetchedAt: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      metrics: {
        totalUsers,
        totalWallets,
        totalTransactions,
        totalWalletBalance: totalWalletBalanceRaw?.sum ?? '0',
        pendingMobileMoney,
        completedMobileMoney,
        failedMobileMoney,
        totalReferrals,
        activeReferrals,
        fraudFlaggedReferrals,
        pendingRewards,
        creditedRewardsTotalCDF: creditedRewardsRaw?.sum ?? '0',
      },
      fxSnapshot,
      recentTransactions,
      recentReversals,
      recentWalletActivity,
    };
  }

  async listUsers(query: AdminUsersQueryDto) {
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.wallet', 'wallet')
      .orderBy('user.createdAt', 'DESC');

    if (query.search) {
      qb.andWhere(
        '(user.fullName ILIKE :search OR user.email ILIKE :search OR CAST(user.id AS text) ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    if (query.status) {
      qb.andWhere('user.isActive = :isActive', {
        isActive: query.status === 'active',
      });
    }

    return this.paginate(qb, query);
  }

  async getUserDetail(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { wallet: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserStatus(id: string, isActive: boolean) {
    const user = await this.getUserDetail(id);
    user.isActive = isActive;
    return this.usersRepository.save(user);
  }

  async updateUserProfile(
    id: string,
    body: UpdateAdminUserProfileDto,
    adminUserId: string,
  ) {
    const user = await this.getUserDetail(id);
    const before = {
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
    };
    const updatedUser = await this.usersService.updateProfile(id, body);

    await this.auditService.logAdminAction({
      adminUserId,
      actionType: 'admin.user.profile.update',
      targetEntity: 'user',
      targetEntityId: id,
      beforeJson: before,
      afterJson: {
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        isActive: updatedUser.isActive,
      },
    });

    return updatedUser;
  }

  async generatePasswordResetLink(id: string, adminUserId: string) {
    const user = await this.getUserDetail(id);
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    await this.usersService.setPasswordResetToken(id, token, expiresAt);

    const resetLink = `http://localhost:3001/reset-password?token=${token}`;

    await this.auditService.logAdminAction({
      adminUserId,
      actionType: 'admin.user.password_reset_link.generate',
      targetEntity: 'user',
      targetEntityId: id,
      metadataJson: { expiresAt: expiresAt.toISOString() },
    });

    return {
      userId: user.id,
      email: user.email,
      resetLink,
      expiresAt,
    };
  }

  async getUserWallet(userId: string) {
    const user = await this.getUserDetail(userId);
    return this.getWallet(user.wallet.id);
  }

  async getUserWalletHistory(userId: string) {
    const user = await this.getUserDetail(userId);
    return this.walletTransactionsRepository.find({
      where: { wallet: { id: user.wallet.id } },
      relations: { wallet: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserLedger(userId: string) {
    const user = await this.getUserDetail(userId);
    return this.ledgerRepository.find({
      where: { wallet: { id: user.wallet.id } },
      relations: { transaction: true, wallet: { user: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserMobileMoney(userId: string) {
    await this.getUserDetail(userId);
    return this.mobileMoneyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserBankAccounts(userId: string) {
    await this.getUserDetail(userId);
    return this.bankAccountsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserBankTransfers(userId: string) {
    await this.getUserDetail(userId);
    return this.bankTransfersRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserQRCode(userId: string) {
    return this.usersService.getQRCode(userId);
  }

  async listTransactions(query: AdminTransactionsQueryDto) {
    const qb = this.transactionsRepository
      .createQueryBuilder('transaction')
      .orderBy('transaction.createdAt', 'DESC');

    if (query.search) {
      qb.andWhere(
        '(transaction.reference ILIKE :search OR transaction.description ILIKE :search OR CAST(transaction.id AS text) ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.status) {
      qb.andWhere('transaction.status = :status', { status: query.status });
    }

    if (query.type) {
      qb.andWhere('transaction.type = :type', { type: query.type });
    }

    if (query.currency) {
      qb.andWhere('transaction.currency = :currency', { currency: query.currency });
    }

    if (query.sourceCurrency) {
      qb.andWhere('transaction.sourceCurrency = :sourceCurrency', {
        sourceCurrency: query.sourceCurrency,
      });
    }

    if (query.userId) {
      qb.andWhere(
        '(transaction.senderUserId = :userId OR transaction.receiverUserId = :userId)',
        { userId: query.userId },
      );
    }

    if (query.minAmount !== undefined) {
      qb.andWhere('transaction.amount >= :minAmount', { minAmount: query.minAmount });
    }

    if (query.maxAmount !== undefined) {
      qb.andWhere('transaction.amount <= :maxAmount', { maxAmount: query.maxAmount });
    }

    this.applyDateRange(qb, 'transaction.createdAt', query.dateFrom, query.dateTo);

    return this.paginate(qb, query);
  }

  async getTransactionDetail(id: string) {
    const transaction = await this.transactionsRepository.findOne({ where: { id } });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const ledgerEntries = await this.ledgerRepository.find({
      where: { transaction: { id } },
      relations: { wallet: { user: true }, transaction: true },
      order: { createdAt: 'ASC' },
    });

    return {
      transaction,
      ledgerEntries,
    };
  }

  async reverseTransaction(id: string) {
    return this.transactionsService.reverseTransaction(id);
  }

  async listMobileMoney(query: AdminMobileMoneyQueryDto) {
    return this.mobileMoneyService.listAllTransactions({
      status: query.status,
      type: query.type,
      userId: query.userId,
      search: query.search,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  async getMobileMoney(id: string) {
    return this.mobileMoneyService.getTransactionById(id);
  }

  async approveMobileMoney(id: string, message?: string) {
    return this.mobileMoneyService.approveById(id, message);
  }

  async rejectMobileMoney(id: string, message?: string) {
    return this.mobileMoneyService.rejectById(id, message);
  }

  async listWallets(query: AdminWalletsQueryDto) {
    const qb = this.walletsRepository
      .createQueryBuilder('wallet')
      .leftJoinAndSelect('wallet.user', 'user')
      .orderBy('wallet.createdAt', 'DESC');

    if (query.search) {
      qb.andWhere(
        '(CAST(wallet.id AS text) ILIKE :search OR user.fullName ILIKE :search OR user.email ILIKE :search OR CAST(user.id AS text) ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.userId) {
      qb.andWhere('user.id = :userId', { userId: query.userId });
    }

    return this.paginate(qb, query);
  }

  async getWallet(walletId: string) {
    const wallet = await this.walletsRepository.findOne({
      where: { id: walletId },
      relations: { user: true },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const raw = await this.ledgerRepository
      .createQueryBuilder('ledger')
      .select(
        "COALESCE(SUM(CASE WHEN ledger.entryType = 'credit' THEN ledger.amount ELSE -ledger.amount END), 0)",
        'balance',
      )
      .where('ledger.walletId = :walletId', { walletId })
      .getRawOne<{ balance: string }>();

    const derivedLedgerBalance = raw?.balance ?? '0';

    return {
      ...wallet,
      derivedLedgerBalance,
      balanceDelta: (Number(wallet.balance) - Number(derivedLedgerBalance)).toFixed(2),
    };
  }

  async getWalletHistory(walletId: string) {
    await this.getWallet(walletId);
    return this.walletTransactionsRepository.find({
      where: { wallet: { id: walletId } },
      relations: { wallet: { user: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async getWalletLedger(walletId: string) {
    await this.getWallet(walletId);
    return this.ledgerRepository.find({
      where: { wallet: { id: walletId } },
      relations: { wallet: { user: true }, transaction: true },
      order: { createdAt: 'DESC' },
    });
  }

  async listLedger(query: AdminLedgerQueryDto) {
    const qb = this.ledgerRepository
      .createQueryBuilder('ledger')
      .leftJoinAndSelect('ledger.wallet', 'wallet')
      .leftJoinAndSelect('wallet.user', 'user')
      .leftJoinAndSelect('ledger.transaction', 'transaction')
      .orderBy('ledger.createdAt', 'DESC');

    if (query.search) {
      qb.andWhere(
        '(ledger.description ILIKE :search OR CAST(ledger.id AS text) ILIKE :search OR CAST(transaction.id AS text) ILIKE :search OR CAST(wallet.id AS text) ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.walletId) {
      qb.andWhere('wallet.id = :walletId', { walletId: query.walletId });
    }

    if (query.userId) {
      qb.andWhere('user.id = :userId', { userId: query.userId });
    }

    if (query.transactionId) {
      qb.andWhere('transaction.id = :transactionId', {
        transactionId: query.transactionId,
      });
    }

    if (query.type) {
      qb.andWhere('ledger.entryType = :type', { type: query.type });
    }

    this.applyDateRange(qb, 'ledger.createdAt', query.dateFrom, query.dateTo);

    return this.paginate(qb, query);
  }

  async listBankTransfers(query: AdminBankQueryDto) {
    const qb = this.bankTransfersRepository
      .createQueryBuilder('transfer')
      .orderBy('transfer.createdAt', 'DESC');

    if (query.search) {
      qb.andWhere(
        '(transfer.reference ILIKE :search OR transfer.description ILIKE :search OR CAST(transfer.id AS text) ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.userId) {
      qb.andWhere('transfer.userId = :userId', { userId: query.userId });
    }

    if (query.status) {
      qb.andWhere('transfer.status = :status', { status: query.status });
    }

    return this.paginate(qb, query);
  }

  async listBankAccounts(query: AdminListQueryDto) {
    const qb = this.bankAccountsRepository
      .createQueryBuilder('account')
      .orderBy('account.createdAt', 'DESC');

    if (query.search) {
      qb.andWhere(
        '(account.bankName ILIKE :search OR account.accountHolderName ILIKE :search OR account.accountNumber ILIKE :search OR CAST(account.userId AS text) ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    return this.paginate(qb, query);
  }

  async listReferrals(query: AdminReferralsQueryDto) {
    return this.referralsService.listAdminReferrals(query);
  }

  async getReferralAnalytics(userId: string) {
    return this.referralsService.getUserReferralAnalytics(userId);
  }

  async rejectReferral(id: string, reason: string | undefined, adminUserId: string) {
    const referral = await this.referralsService.rejectReferral(id, reason);
    await this.auditService.logAdminAction({
      adminUserId,
      actionType: 'admin.referral.reject',
      targetEntity: 'referral',
      targetEntityId: id,
      metadataJson: { reason: reason ?? null },
    });
    return referral;
  }

  async flagReferralFraud(id: string, reason: string | undefined, adminUserId: string) {
    const referral = await this.referralsService.flagReferralFraud(id, reason);
    await this.auditService.logAdminAction({
      adminUserId,
      actionType: 'admin.referral.flag_fraud',
      targetEntity: 'referral',
      targetEntityId: id,
      metadataJson: { reason: reason ?? null },
    });
    return referral;
  }

  async listRewardRules() {
    return this.rewardsService.listRewardRules();
  }

  async createRewardRule(body: CreateRewardRuleDto, adminUserId: string) {
    const rewardRule = await this.rewardsService.createRewardRule(body, adminUserId);
    await this.auditService.logAdminAction({
      adminUserId,
      actionType: 'admin.reward_rule.create',
      targetEntity: 'reward_rule',
      targetEntityId: rewardRule.id,
      afterJson: rewardRule as unknown as Record<string, unknown>,
    });
    return rewardRule;
  }

  async updateRewardRule(id: string, body: UpdateRewardRuleDto, adminUserId: string) {
    const rewardRule = await this.rewardsService.updateRewardRule(id, body, adminUserId);
    await this.auditService.logAdminAction({
      adminUserId,
      actionType: 'admin.reward_rule.update',
      targetEntity: 'reward_rule',
      targetEntityId: id,
      afterJson: rewardRule as unknown as Record<string, unknown>,
    });
    return rewardRule;
  }

  async listRewards(query: AdminRewardsQueryDto) {
    return this.rewardsService.listAdminRewards(query);
  }

  async getReward(id: string) {
    return this.rewardsService.getRewardById(id);
  }

  async approveReward(id: string, reason: string | undefined, adminUserId: string) {
    const reward = await this.rewardsService.approveReward(id, adminUserId, reason);
    await this.auditService.logAdminAction({
      adminUserId,
      actionType: 'admin.reward.approve',
      targetEntity: 'reward',
      targetEntityId: id,
      metadataJson: { reason: reason ?? null },
    });
    return reward;
  }

  async rejectReward(id: string, reason: string | undefined, adminUserId: string) {
    const reward = await this.rewardsService.rejectReward(id, adminUserId, reason);
    await this.auditService.logAdminAction({
      adminUserId,
      actionType: 'admin.reward.reject',
      targetEntity: 'reward',
      targetEntityId: id,
      metadataJson: { reason: reason ?? null },
    });
    return reward;
  }

  async listMarketplaceProviders(query: AdminMarketplaceQueryDto) {
    return this.marketplaceService.listAdminProviders(query);
  }

  async listMarketplaceCategories() {
    return this.marketplaceService.listAdminCategories();
  }

  async createMarketplaceProvider(
    body: CreateMarketplaceProviderDto,
    adminUserId: string,
  ) {
    const provider = await this.marketplaceService.createProvider(body);
    await this.auditService.logAdminAction({
      adminUserId,
      actionType: 'admin.marketplace.provider.create',
      targetEntity: 'marketplace_provider',
      targetEntityId: provider.id,
      afterJson: provider as unknown as Record<string, unknown>,
    });
    return provider;
  }

  async updateMarketplaceProvider(
    id: string,
    body: UpdateMarketplaceProviderDto,
    adminUserId: string,
  ) {
    const provider = await this.marketplaceService.updateProvider(id, body);
    await this.auditService.logAdminAction({
      adminUserId,
      actionType: 'admin.marketplace.provider.update',
      targetEntity: 'marketplace_provider',
      targetEntityId: id,
      afterJson: provider as unknown as Record<string, unknown>,
    });
    return provider;
  }

  async updateMarketplaceProviderVisibility(
    id: string,
    isVisible: boolean,
    adminUserId: string,
  ) {
    const provider = await this.marketplaceService.updateProviderVisibility(
      id,
      isVisible,
    );
    await this.auditService.logAdminAction({
      adminUserId,
      actionType: 'admin.marketplace.provider.visibility',
      targetEntity: 'marketplace_provider',
      targetEntityId: id,
      metadataJson: { isVisible },
    });
    return provider;
  }

  async updateMarketplaceProviderStatus(
    id: string,
    status: MarketplaceProviderStatus,
    adminUserId: string,
  ) {
    const provider = await this.marketplaceService.updateProviderStatus(id, status);
    await this.auditService.logAdminAction({
      adminUserId,
      actionType: 'admin.marketplace.provider.status',
      targetEntity: 'marketplace_provider',
      targetEntityId: id,
      metadataJson: { status },
    });
    return provider;
  }

  async listSupportConversations(query: AdminSupportQueryDto) {
    return this.supportService.listAdminConversations(query);
  }

  async getSupportConversation(id: string) {
    return this.supportService.getConversationForAdmin(id);
  }

  async assignSupportConversation(
    id: string,
    body: UpdateSupportAssignmentDto,
    adminUserId: string,
  ) {
    const conversation = await this.supportService.assignConversation(
      id,
      body,
      adminUserId,
    );
    await this.auditService.logAdminAction({
      adminUserId,
      actionType: 'admin.support.assign',
      targetEntity: 'support_conversation',
      targetEntityId: id,
      metadataJson: { assignedAdminId: conversation.assignedAdminId },
    });
    return conversation;
  }

  async updateSupportConversationStatus(
    id: string,
    body: UpdateSupportStatusDto,
    adminUserId: string,
  ) {
    const conversation = await this.supportService.updateConversationStatus(
      id,
      body,
      adminUserId,
    );
    await this.auditService.logAdminAction({
      adminUserId,
      actionType: 'admin.support.status',
      targetEntity: 'support_conversation',
      targetEntityId: id,
      metadataJson: { status: body.status, note: body.note ?? null },
    });
    return conversation;
  }

  async addSupportConversationMessage(
    id: string,
    body: CreateSupportMessageDto,
    adminUserId: string,
  ) {
    const conversation = await this.supportService.addMessageForAdmin(
      adminUserId,
      id,
      body,
    );
    await this.auditService.logAdminAction({
      adminUserId,
      actionType: body.isInternalNote
        ? 'admin.support.internal_note'
        : 'admin.support.reply',
      targetEntity: 'support_conversation',
      targetEntityId: id,
    });
    return conversation;
  }

  private applyDateRange<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    column: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    if (dateFrom) {
      qb.andWhere(`${column} >= :dateFrom`, { dateFrom });
    }

    if (dateTo) {
      qb.andWhere(`${column} <= :dateTo`, { dateTo });
    }
  }

  private async paginate<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    query: AdminListQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
    };
  }
}
