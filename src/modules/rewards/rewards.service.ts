import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { RewardRule } from './entities/reward-rule.entity';
import { ReferralReward } from './entities/referral-reward.entity';
import { RewardTriggerType } from './enums/reward-trigger-type.enum';
import { RewardApprovalMode } from './enums/reward-approval-mode.enum';
import { RewardStatus } from './enums/reward-status.enum';
import { Referral } from '../referrals/entities/referral.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletTransaction } from '../wallets/entities/wallet-transaction.entity';
import { WalletTransactionStatus } from '../wallets/enums/wallet-transaction-status.enum';
import { WalletTransactionType } from '../wallets/enums/wallet-transaction-type.enum';
import { LedgerEntry } from '../ledger/entities/ledger-entry.entity';
import { LedgerEntryType } from '../ledger/enums/ledger-entry-type.enum';
import { UsersService } from '../users/users.service';
import { CreateRewardRuleDto } from './dto/create-reward-rule.dto';
import { UpdateRewardRuleDto } from './dto/update-reward-rule.dto';
import { AdminRewardsQueryDto } from '../admin/dto/admin-rewards-query.dto';
import { ReferralsService } from '../referrals/referrals.service';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(RewardRule)
    private readonly rewardRulesRepository: Repository<RewardRule>,
    @InjectRepository(ReferralReward)
    private readonly referralRewardsRepository: Repository<ReferralReward>,
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ReferralsService))
    private readonly referralsService: ReferralsService,
  ) {}

  async ensureDefaultRules() {
    const count = await this.rewardRulesRepository.count();

    if (count > 0) {
      return;
    }

    const defaultRule = this.rewardRulesRepository.create({
      name: 'First transaction referral reward',
      triggerType: RewardTriggerType.FIRST_TRANSACTION,
      rewardAmountCDF: '5000.00',
      approvalMode: RewardApprovalMode.MANUAL,
      isActive: true,
      createdByAdminId: null,
      updatedByAdminId: null,
    });

    await this.rewardRulesRepository.save(defaultRule);
  }

  async evaluateReferral(referralId: string) {
    await this.ensureDefaultRules();

    const referral = await this.referralsRepository.findOne({
      where: { id: referralId },
      relations: { referrer: true, referredUser: true },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    const rule = await this.rewardRulesRepository.findOne({
      where: {
        triggerType: RewardTriggerType.FIRST_TRANSACTION,
        isActive: true,
      },
      order: { createdAt: 'ASC' },
    });

    if (!rule || referral.fraudFlag) {
      return null;
    }

    const existingReward = await this.referralRewardsRepository.findOne({
      where: {
        referral: { id: referral.id },
        rewardType: RewardTriggerType.FIRST_TRANSACTION,
      },
      relations: { referral: true },
    });

    if (existingReward) {
      return existingReward;
    }

    const reward = this.referralRewardsRepository.create({
      referral,
      referrer: referral.referrer,
      rule,
      rewardType: RewardTriggerType.FIRST_TRANSACTION,
      amountCDF: rule.rewardAmountCDF,
      status:
        rule.approvalMode === RewardApprovalMode.AUTO
          ? RewardStatus.APPROVED
          : RewardStatus.PENDING,
      reason: null,
    });

    const savedReward = await this.referralRewardsRepository.save(reward);

    if (savedReward.status === RewardStatus.PENDING) {
      await this.referralsService.markRewardPending(referral.id);
      return savedReward;
    }

    return this.creditReward(savedReward.id);
  }

  async listMyRewardHistory(userId: string) {
    return this.referralRewardsRepository.find({
      where: { referrer: { id: userId } },
      relations: { rule: true, referral: { referredUser: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async listRewardRules() {
    await this.ensureDefaultRules();
    return this.rewardRulesRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async createRewardRule(body: CreateRewardRuleDto, adminUserId: string) {
    const rewardRule = this.rewardRulesRepository.create({
      ...body,
      approvalMode: body.approvalMode ?? RewardApprovalMode.MANUAL,
      isActive: body.isActive ?? true,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      createdByAdminId: adminUserId,
      updatedByAdminId: adminUserId,
    });

    return this.rewardRulesRepository.save(rewardRule);
  }

  async updateRewardRule(id: string, body: UpdateRewardRuleDto, adminUserId: string) {
    const rule = await this.rewardRulesRepository.findOne({ where: { id } });

    if (!rule) {
      throw new NotFoundException('Reward rule not found');
    }

    Object.assign(rule, {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : rule.startDate,
      endDate: body.endDate ? new Date(body.endDate) : rule.endDate,
      updatedByAdminId: adminUserId,
    });

    return this.rewardRulesRepository.save(rule);
  }

  async listAdminRewards(query: AdminRewardsQueryDto) {
    const qb = this.referralRewardsRepository
      .createQueryBuilder('reward')
      .leftJoinAndSelect('reward.referrer', 'referrer')
      .leftJoinAndSelect('reward.referral', 'referral')
      .leftJoinAndSelect('referral.referredUser', 'referredUser')
      .leftJoinAndSelect('reward.rule', 'rule')
      .orderBy('reward.createdAt', 'DESC');

    if (query.search) {
      qb.andWhere(
        '(referrer.fullName ILIKE :search OR referrer.email ILIKE :search OR referredUser.fullName ILIKE :search OR referredUser.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.userId) {
      qb.andWhere('referrer.id = :userId', { userId: query.userId });
    }

    if (query.status) {
      qb.andWhere('reward.status = :status', { status: query.status });
    }

    return this.paginate(qb, query.page ?? 1, query.limit ?? 20);
  }

  async getRewardById(id: string) {
    const reward = await this.referralRewardsRepository.findOne({
      where: { id },
      relations: {
        referrer: true,
        rule: true,
        referral: { referredUser: true },
        creditedWallet: true,
        ledgerEntry: true,
      },
    });

    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    return reward;
  }

  async approveReward(id: string, adminUserId: string, reason?: string) {
    const reward = await this.getRewardById(id);

    if (reward.status === RewardStatus.CREDITED) {
      return reward;
    }

    reward.status = RewardStatus.APPROVED;
    reward.approvedByAdminId = adminUserId;
    reward.reason = reason ?? reward.reason;
    await this.referralRewardsRepository.save(reward);

    return this.creditReward(reward.id);
  }

  async rejectReward(id: string, adminUserId: string, reason?: string) {
    const reward = await this.getRewardById(id);
    reward.status = RewardStatus.REJECTED;
    reward.rejectedByAdminId = adminUserId;
    reward.reason = reason ?? reward.reason;
    await this.referralRewardsRepository.save(reward);
    return reward;
  }

  private async creditReward(id: string) {
    const reward = await this.getRewardById(id);

    if (reward.status === RewardStatus.CREDITED) {
      return reward;
    }

    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const walletTxRepo = manager.getRepository(WalletTransaction);
      const ledgerRepo = manager.getRepository(LedgerEntry);
      const rewardRepo = manager.getRepository(ReferralReward);

      const user = await this.usersService.findById(reward.referrer.id);
      const wallet = await walletRepo.findOne({
        where: { user: { id: user.id } },
        relations: ['user'],
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const balanceBefore = Number(wallet.balance);
      const numericAmount = Number(reward.amountCDF);
      wallet.balance = (balanceBefore + numericAmount).toFixed(2);
      await walletRepo.save(wallet);

      const walletTransaction = await walletTxRepo.save(
        walletTxRepo.create({
          wallet,
          type: WalletTransactionType.CREDIT,
          status: WalletTransactionStatus.COMPLETED,
          amount: reward.amountCDF,
          currency: 'CDF',
          description: `Referral reward: ${reward.rule.name}`,
          reference: `REFERRAL-REWARD-${Date.now()}`,
          balanceBefore: balanceBefore.toFixed(2),
          balanceAfter: wallet.balance,
        }),
      );

      const ledgerEntry = await ledgerRepo.save(
        ledgerRepo.create({
          wallet,
          transaction: null,
          entryType: LedgerEntryType.CREDIT,
          amount: reward.amountCDF,
          currency: 'CDF',
          description: `Referral reward credit (${reward.rewardType})`,
        }),
      );

      reward.status = RewardStatus.CREDITED;
      reward.creditedWallet = wallet;
      reward.ledgerEntry = ledgerEntry;

      const savedReward = await rewardRepo.save(reward);
      await this.referralsService.markRewardCredited(reward.referral.id);

      return {
        ...savedReward,
        walletTransaction,
      };
    });
  }

  private async paginate(
    qb: SelectQueryBuilder<ReferralReward>,
    page: number,
    limit: number,
  ) {
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }
}
