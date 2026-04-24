import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referral } from './entities/referral.entity';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { UsersModule } from '../users/users.module';
import { ReferralReward } from '../rewards/entities/referral-reward.entity';
import { User } from '../users/entities/user.entity';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Referral, ReferralReward, User]),
    UsersModule,
    forwardRef(() => RewardsModule),
  ],
  providers: [ReferralsService],
  controllers: [ReferralsController],
  exports: [ReferralsService, TypeOrmModule],
})
export class ReferralsModule {}
