import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('me/summary')
  getMySummary(@Req() req: any) {
    return this.referralsService.getReferralSummary(req.user.sub);
  }

  @Get('me/list')
  getMyReferrals(@Req() req: any) {
    return this.referralsService.listMyReferrals(req.user.sub);
  }
}
