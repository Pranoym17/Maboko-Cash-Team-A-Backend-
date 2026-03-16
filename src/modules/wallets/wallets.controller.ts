import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { WalletsService } from './wallets.service';
import { WalletActionDto } from './dto/wallet-action.dto';

@ApiTags('Wallets')
@Controller('wallets')
export class WalletsController {
  constructor(
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user wallet' })
  async getMyWallet(@Req() req: any) {
    const user = await this.usersService.findById(req.user.sub);
    return user.wallet;
  }

  @Get('me/balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user wallet balance' })
  async getMyWalletBalance(@Req() req: any) {
    return this.walletsService.getWalletBalance(req.user.sub);
  }

  @Get('me/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user wallet transaction history' })
  async getMyWalletHistory(@Req() req: any) {
    return this.walletsService.getWalletHistory(req.user.sub);
  }

  @Post('me/credit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin only: credit a user wallet for testing' })
  async creditMyWallet(@Req() req: any, @Body() walletActionDto: WalletActionDto) {
    return this.walletsService.creditWallet(
      req.user.sub,
      walletActionDto.amount,
      walletActionDto.description,
    );
  }

  @Post('me/debit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin only: debit a user wallet for testing' })
  async debitMyWallet(@Req() req: any, @Body() walletActionDto: WalletActionDto) {
    return this.walletsService.debitWallet(
      req.user.sub,
      walletActionDto.amount,
      walletActionDto.description,
    );
  }

  @Get('admin/user/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin only: get wallet by user id' })
  async getWalletByUserId(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return user.wallet;
  }
}