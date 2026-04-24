import { PartialType } from '@nestjs/mapped-types';
import { CreateMarketplaceProviderDto } from './create-marketplace-provider.dto';

export class UpdateMarketplaceProviderDto extends PartialType(
  CreateMarketplaceProviderDto,
) {}
