import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RewardsService } from './rewards.service';

@Controller('rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('me/history')
  getMyRewardHistory(@Req() req: any) {
    return this.rewardsService.listMyRewardHistory(req.user.sub);
  }
}
