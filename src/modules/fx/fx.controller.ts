import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FxService } from './fx.service';
import { UpdateFxRateDto } from './dto/update-fx-rate.dto';
import { FxDepositDto } from './dto/fx-deposit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('FX')
@Controller('fx')
export class FxController {
  constructor(private readonly fxService: FxService) {}

  @Get('rates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List cached FX rates' })
  async listRates() {
    return this.fxService.listRates();
  }

  @Get('rates/:baseCurrency')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get latest FX rate to CDF, refreshing if stale' })
  async getRate(@Param('baseCurrency') baseCurrency: string) {
    return this.fxService.getRate(baseCurrency, 'CDF');
  }

  @Post('rates/manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin only: manually upsert FX rate' })
  async manuallyUpdate(@Body() dto: UpdateFxRateDto) {
    return this.fxService.manuallyUpdateRate(dto);
  }

  @Post('deposit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Simulate FX deposit and credit wallet in CDF' })
  async fxDeposit(@Req() req: any, @Body() dto: FxDepositDto) {
    return this.fxService.createFxDeposit(req.user.sub, dto);
  }
}