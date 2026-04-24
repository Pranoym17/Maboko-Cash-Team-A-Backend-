import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMarketplaceDraftDto } from './dto/create-marketplace-draft.dto';

@Controller('marketplace')
@UseGuards(JwtAuthGuard)
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('overview')
  getOverview() {
    return this.marketplaceService.getOverview();
  }

  @Get('providers')
  listProviders() {
    return this.marketplaceService.listVisibleProviders();
  }

  @Post('transactions/draft')
  createTransactionDraft(@Body() body: CreateMarketplaceDraftDto) {
    return this.marketplaceService.createTransactionDraft(body);
  }
}
