import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase123ReferralsRewardsAudit1760000000000
  implements MigrationInterface
{
  name = 'Phase123ReferralsRewardsAudit1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "referralCode" character varying,
      ADD COLUMN IF NOT EXISTS "referredByUserId" character varying,
      ADD COLUMN IF NOT EXISTS "passwordResetToken" character varying,
      ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" TIMESTAMPTZ
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_users_referralCode'
        ) THEN
          ALTER TABLE "users" ADD CONSTRAINT "UQ_users_referralCode" UNIQUE ("referralCode");
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'referrals_status_enum'
        ) THEN
          CREATE TYPE "referrals_status_enum" AS ENUM (
            'registered',
            'active',
            'reward_pending',
            'rewarded',
            'rejected'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "referrals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "referralCodeUsed" character varying NOT NULL,
        "shareChannel" character varying,
        "status" "referrals_status_enum" NOT NULL DEFAULT 'registered',
        "registeredAt" TIMESTAMPTZ NOT NULL,
        "firstValidTransactionAt" TIMESTAMPTZ,
        "rewardEligibilityAt" TIMESTAMPTZ,
        "rewardedAt" TIMESTAMPTZ,
        "fraudFlag" boolean NOT NULL DEFAULT false,
        "fraudReason" text,
        "notes" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "referrerId" uuid,
        "referredUserId" uuid,
        CONSTRAINT "PK_referrals_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_referrals_referrerId" ON "referrals" ("referrerId")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_referrals_referredUserId" ON "referrals" ("referredUserId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_referrals_status" ON "referrals" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_referrals_fraudFlag" ON "referrals" ("fraudFlag")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_referrals_referrerId_users'
        ) THEN
          ALTER TABLE "referrals"
          ADD CONSTRAINT "FK_referrals_referrerId_users"
          FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE CASCADE;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_referrals_referredUserId_users'
        ) THEN
          ALTER TABLE "referrals"
          ADD CONSTRAINT "FK_referrals_referredUserId_users"
          FOREIGN KEY ("referredUserId") REFERENCES "users"("id") ON DELETE CASCADE;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'reward_rules_triggertype_enum'
        ) THEN
          CREATE TYPE "reward_rules_triggertype_enum" AS ENUM (
            'registration',
            'first_transaction',
            'milestone_bonus'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'reward_rules_approvalmode_enum'
        ) THEN
          CREATE TYPE "reward_rules_approvalmode_enum" AS ENUM (
            'auto',
            'manual'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reward_rules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "triggerType" "reward_rules_triggertype_enum" NOT NULL,
        "rewardAmountCDF" numeric(18,2) NOT NULL,
        "milestoneCount" integer,
        "approvalMode" "reward_rules_approvalmode_enum" NOT NULL DEFAULT 'manual',
        "isActive" boolean NOT NULL DEFAULT true,
        "startDate" TIMESTAMPTZ,
        "endDate" TIMESTAMPTZ,
        "createdByAdminId" character varying,
        "updatedByAdminId" character varying,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reward_rules_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'referral_rewards_rewardtype_enum'
        ) THEN
          CREATE TYPE "referral_rewards_rewardtype_enum" AS ENUM (
            'registration',
            'first_transaction',
            'milestone_bonus'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'referral_rewards_status_enum'
        ) THEN
          CREATE TYPE "referral_rewards_status_enum" AS ENUM (
            'pending',
            'approved',
            'credited',
            'rejected'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "referral_rewards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "rewardType" "referral_rewards_rewardtype_enum" NOT NULL,
        "amountCDF" numeric(18,2) NOT NULL,
        "status" "referral_rewards_status_enum" NOT NULL DEFAULT 'pending',
        "approvedByAdminId" character varying,
        "rejectedByAdminId" character varying,
        "reason" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "referralId" uuid,
        "referrerId" uuid,
        "ruleId" uuid,
        "creditedWalletId" uuid,
        "ledgerEntryId" uuid,
        CONSTRAINT "PK_referral_rewards_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_referral_rewards_referral_rule_type"
      ON "referral_rewards" ("referralId", "rewardType")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_referral_rewards_referralId_referrals'
        ) THEN
          ALTER TABLE "referral_rewards"
          ADD CONSTRAINT "FK_referral_rewards_referralId_referrals"
          FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE CASCADE;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_referral_rewards_referrerId_users'
        ) THEN
          ALTER TABLE "referral_rewards"
          ADD CONSTRAINT "FK_referral_rewards_referrerId_users"
          FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE CASCADE;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_referral_rewards_ruleId_reward_rules'
        ) THEN
          ALTER TABLE "referral_rewards"
          ADD CONSTRAINT "FK_referral_rewards_ruleId_reward_rules"
          FOREIGN KEY ("ruleId") REFERENCES "reward_rules"("id") ON DELETE CASCADE;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_referral_rewards_creditedWalletId_wallets'
        ) THEN
          ALTER TABLE "referral_rewards"
          ADD CONSTRAINT "FK_referral_rewards_creditedWalletId_wallets"
          FOREIGN KEY ("creditedWalletId") REFERENCES "wallets"("id") ON DELETE SET NULL;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_referral_rewards_ledgerEntryId_ledger_entries'
        ) THEN
          ALTER TABLE "referral_rewards"
          ADD CONSTRAINT "FK_referral_rewards_ledgerEntryId_ledger_entries"
          FOREIGN KEY ("ledgerEntryId") REFERENCES "ledger_entries"("id") ON DELETE SET NULL;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "adminUserId" character varying NOT NULL,
        "actionType" character varying NOT NULL,
        "targetEntity" character varying NOT NULL,
        "targetEntityId" character varying NOT NULL,
        "beforeJson" text,
        "afterJson" text,
        "metadataJson" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_audit_logs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "ledger_entries"
      ALTER COLUMN "transactionId" DROP NOT NULL
    `);

    await queryRunner.query(`
      INSERT INTO "reward_rules" (
        "name",
        "triggerType",
        "rewardAmountCDF",
        "approvalMode",
        "isActive",
        "createdAt",
        "updatedAt"
      )
      SELECT
        'First transaction referral reward',
        'first_transaction',
        5000.00,
        'manual',
        true,
        now(),
        now()
      WHERE NOT EXISTS (
        SELECT 1 FROM "reward_rules" WHERE "triggerType" = 'first_transaction'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "referral_rewards"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reward_rules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "referrals"`);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "passwordResetExpiresAt",
      DROP COLUMN IF EXISTS "passwordResetToken",
      DROP COLUMN IF EXISTS "referredByUserId",
      DROP COLUMN IF EXISTS "referralCode"
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "referral_rewards_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "referral_rewards_rewardtype_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "reward_rules_approvalmode_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "reward_rules_triggertype_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "referrals_status_enum"`);
  }
}
