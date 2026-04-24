import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceCategory } from './entities/marketplace-category.entity';
import { MarketplaceProvider } from './entities/marketplace-provider.entity';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MarketplaceCategory, MarketplaceProvider])],
  providers: [MarketplaceService],
  controllers: [MarketplaceController],
  exports: [MarketplaceService, TypeOrmModule],
})
export class MarketplaceModule {}
