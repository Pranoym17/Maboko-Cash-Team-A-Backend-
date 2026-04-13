import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Post('transfer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Req() req, @Body() dto: CreateTransferDto) {
    return this.service.createPeerToPeerTransfer(req.user.sub, dto);
  }

  @Post('reverse/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  reverse(@Param('id') id: string) {
    return this.service.reverseTransaction(id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMine(@Req() req) {
    return this.service.getTransactionsForUser(req.user.sub);
  }

  @Get('me/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyOne(@Req() req, @Param('id') id: string) {
    return this.service.getTransactionForUser(req.user.sub, id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  getAll() {
    return this.service.getAllTransactions();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  getOne(@Param('id') id: string) {
    return this.service.getTransactionById(id);
  }
}
