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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  reverse(@Param('id') id: string) {
    return this.service.reverseTransaction(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getAll() {
    return this.service.getAllTransactions();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getOne(@Param('id') id: string) {
    return this.service.getTransactionById(id);
  }
}