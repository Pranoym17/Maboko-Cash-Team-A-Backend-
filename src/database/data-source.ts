import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Wallet } from '../modules/wallets/entities/wallet.entity';
import { WalletTransaction } from '../modules/wallets/entities/wallet-transaction.entity';
import { LedgerEntry } from '../modules/ledger/entities/ledger-entry.entity';
import { Transaction } from '../modules/transactions/entities/transaction.entity';
import { FxRate } from '../modules/fx/entities/fx-rate.entity';
import { MobileMoneyTransaction } from '../modules/mobile-money/entities/mobile-money-transaction.entity';
import { BankTransfer } from '../modules/bank-transfers/entities/bank-transfer.entity';
import { BankAccount } from '../modules/bank-transfers/entities/bank-account.entity';
import { Referral } from '../modules/referrals/entities/referral.entity';
import { RewardRule } from '../modules/rewards/entities/reward-rule.entity';
import { ReferralReward } from '../modules/rewards/entities/referral-reward.entity';
import { AdminAuditLog } from '../modules/audit/entities/admin-audit-log.entity';
import { MarketplaceCategory } from '../modules/marketplace/entities/marketplace-category.entity';
import { MarketplaceProvider } from '../modules/marketplace/entities/marketplace-provider.entity';
import { SupportConversation } from '../modules/support/entities/support-conversation.entity';
import { SupportMessage } from '../modules/support/entities/support-message.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  migrationsRun: false,
  entities: [
    User,
    Wallet,
    WalletTransaction,
    LedgerEntry,
    Transaction,
    FxRate,
    MobileMoneyTransaction,
    BankTransfer,
    BankAccount,
    Referral,
    RewardRule,
    ReferralReward,
    AdminAuditLog,
    MarketplaceCategory,
    MarketplaceProvider,
    SupportConversation,
    SupportMessage,
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  ...(process.env.DB_SSL === 'true' && {
    ssl: { rejectUnauthorized: false },
  }),
});
