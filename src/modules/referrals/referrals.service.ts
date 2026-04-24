import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Referral } from './entities/referral.entity';
import { UsersService } from '../users/users.service';
import { ReferralStatus } from './enums/referral-status.enum';
import { User } from '../users/entities/user.entity';
import { ReferralReward } from '../rewards/entities/referral-reward.entity';
import { RewardsService } from '../rewards/rewards.service';
import { AdminReferralsQueryDto } from '../admin/dto/admin-referrals-query.dto';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(ReferralReward)
    private readonly rewardsRepository: Repository<ReferralReward>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => RewardsService))
    private readonly rewardsService: RewardsService,
    private readonly configService: ConfigService,
  ) {}

  async registerReferralForNewUser(userId: string, referralCode: string) {
    const sanitizedCode = referralCode.trim().toUpperCase();
    const referredUser = await this.usersService.findById(userId);
    const referrer = await this.usersService.findByReferralCode(sanitizedCode);

    if (!referrer) {
      throw new BadRequestException('Invalid referral code');
    }

    if (referrer.id === referredUser.id) {
      throw new BadRequestException('Self-referrals are not allowed');
    }

    const existingReferral = await this.referralsRepository.findOne({
      where: { referredUser: { id: referredUser.id } },
      relations: { referredUser: true },
    });

    if (existingReferral) {
      throw new BadRequestException('This user already has a referral record');
    }

    referredUser.referredByUserId = referrer.id;
    await this.usersRepository.save(referredUser);

    const referral = this.referralsRepository.create({
      referrer,
      referredUser,
      referralCodeUsed: sanitizedCode,
      registeredAt: new Date(),
      status: ReferralStatus.REGISTERED,
      fraudFlag: false,
    });

    return this.referralsRepository.save(referral);
  }

  async markReferralActiveByTransaction(userId: string) {
    const referral = await this.referralsRepository.findOne({
      where: { referredUser: { id: userId } },
      relations: { referrer: true, referredUser: true },
    });

    if (!referral) {
      return null;
    }

    if (
      referral.status === ReferralStatus.REWARDED ||
      referral.status === ReferralStatus.REWARD_PENDING ||
      referral.status === ReferralStatus.ACTIVE
    ) {
      return referral;
    }

    if (referral.fraudFlag || referral.status === ReferralStatus.REJECTED) {
      return referral;
    }

    referral.status = ReferralStatus.ACTIVE;
    referral.firstValidTransactionAt = referral.firstValidTransactionAt ?? new Date();
    referral.rewardEligibilityAt = new Date();
    const savedReferral = await this.referralsRepository.save(referral);

    await this.rewardsService.evaluateReferral(savedReferral.id);
    return savedReferral;
  }

  async getReferralSummary(userId: string) {
    const user = await this.usersService.ensureReferralCode(userId);

    const [allReferrals, allRewards] = await Promise.all([
      this.referralsRepository.find({
        where: { referrer: { id: userId } },
        order: { createdAt: 'DESC' },
        relations: { referredUser: true },
      }),
      this.rewardsRepository.find({
        where: { referrer: { id: userId } },
      }),
    ]);

    const invitedCount = allReferrals.length;
    const registeredCount = allReferrals.filter((item) =>
      [
        ReferralStatus.REGISTERED,
        ReferralStatus.ACTIVE,
        ReferralStatus.REWARD_PENDING,
        ReferralStatus.REWARDED,
      ].includes(item.status),
    ).length;
    const activeCount = allReferrals.filter((item) =>
      [ReferralStatus.ACTIVE, ReferralStatus.REWARD_PENDING, ReferralStatus.REWARDED].includes(
        item.status,
      ),
    ).length;
    const rewardedCount = allReferrals.filter((item) => item.status === ReferralStatus.REWARDED)
      .length;

    const pendingRewardsTotalCDF = allRewards
      .filter((item) => item.status === 'pending' || item.status === 'approved')
      .reduce((sum, item) => sum + Number(item.amountCDF), 0);

    const creditedRewardsTotalCDF = allRewards
      .filter((item) => item.status === 'credited')
      .reduce((sum, item) => sum + Number(item.amountCDF), 0);

    return {
      referralCode: user.referralCode,
      referralLink: `${this.configService.get<string>('FRONTEND_BASE_URL') ?? 'http://localhost:3001'}/register?ref=${user.referralCode}`,
      invitedCount,
      registeredCount,
      activeCount,
      rewardedCount,
      pendingRewardsTotalCDF: pendingRewardsTotalCDF.toFixed(2),
      creditedRewardsTotalCDF: creditedRewardsTotalCDF.toFixed(2),
      referrals: allReferrals,
    };
  }

  async listMyReferrals(userId: string) {
    return this.referralsRepository.find({
      where: { referrer: { id: userId } },
      relations: { referredUser: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getReferralById(id: string) {
    const referral = await this.referralsRepository.findOne({
      where: { id },
      relations: { referrer: true, referredUser: true },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    return referral;
  }

  async getUserReferralAnalytics(userId: string) {
    const user = await this.usersService.ensureReferralCode(userId);
    const summary = await this.getReferralSummary(userId);
    const rewards = await this.rewardsRepository.find({
      where: { referrer: { id: userId } },
      relations: { rule: true, referral: { referredUser: true } },
      order: { createdAt: 'DESC' },
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        referralCode: user.referralCode,
      },
      summary,
      rewards,
    };
  }

  async listAdminReferrals(query: AdminReferralsQueryDto) {
    const qb = this.referralsRepository
      .createQueryBuilder('referral')
      .leftJoinAndSelect('referral.referrer', 'referrer')
      .leftJoinAndSelect('referral.referredUser', 'referredUser')
      .orderBy('referral.createdAt', 'DESC');

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
      qb.andWhere('referral.status = :status', { status: query.status });
    }

    if (query.fraudFlag !== undefined) {
      qb.andWhere('referral.fraudFlag = :fraudFlag', {
        fraudFlag: query.fraudFlag === 'true',
      });
    }

    return this.paginate(qb, query.page ?? 1, query.limit ?? 20);
  }

  async rejectReferral(id: string, reason?: string) {
    const referral = await this.getReferralById(id);
    referral.status = ReferralStatus.REJECTED;
    referral.fraudReason = reason ?? referral.fraudReason;
    return this.referralsRepository.save(referral);
  }

  async flagReferralFraud(id: string, reason?: string) {
    const referral = await this.getReferralById(id);
    referral.fraudFlag = true;
    referral.fraudReason = reason ?? 'Flagged by admin';
    if (referral.status !== ReferralStatus.REWARDED) {
      referral.status = ReferralStatus.REJECTED;
    }
    return this.referralsRepository.save(referral);
  }

  async markRewardPending(referralId: string) {
    const referral = await this.getReferralById(referralId);
    if (referral.status !== ReferralStatus.REWARDED) {
      referral.status = ReferralStatus.REWARD_PENDING;
      await this.referralsRepository.save(referral);
    }
    return referral;
  }

  async markRewardCredited(referralId: string) {
    const referral = await this.getReferralById(referralId);
    referral.status = ReferralStatus.REWARDED;
    referral.rewardedAt = new Date();
    return this.referralsRepository.save(referral);
  }

  private async paginate(
    qb: SelectQueryBuilder<Referral>,
    page: number,
    limit: number,
  ) {
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }
}
