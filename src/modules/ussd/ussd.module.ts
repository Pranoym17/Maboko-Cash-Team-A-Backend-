import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';
import { WalletsModule } from '../wallets/wallets.module';
import { UssdTransactionRequest } from './entities/ussd-transaction-request.entity';
import { UssdController } from './ussd.controller';
import { UssdService } from './ussd.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UssdTransactionRequest]),
    UsersModule,
    WalletsModule,
    TransactionsModule,
  ],
  controllers: [UssdController],
  providers: [UssdService],
})
export class UssdModule {}
