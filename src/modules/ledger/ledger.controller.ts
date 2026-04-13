import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { LedgerService } from './ledger.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Ledger')
@Controller('ledger')
export class LedgerController {
  constructor(
    private readonly ledgerService: LedgerService,
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my wallet ledger entries' })
  async getMyLedger(@Req() req: any) {
    const user = await this.usersService.findById(req.user.sub);
    return this.ledgerService.getWalletLedgerEntries(user.wallet.id);
  }

  @Get('me/balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate my wallet balance from ledger entries' })
  async getMyLedgerCalculatedBalance(@Req() req: any) {
    const user = await this.usersService.findById(req.user.sub);
    return this.ledgerService.calculateWalletBalanceFromLedger(user.wallet.id);
  }

  @Get('wallet/:walletId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ledger entries for a wallet id' })
  async getWalletLedger(@Param('walletId') walletId: string) {
    return this.ledgerService.getWalletLedgerEntries(walletId);
  }
}
