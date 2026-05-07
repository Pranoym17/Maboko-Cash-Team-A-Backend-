import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestrictLedgerCascadeDeletes1760000003000 implements MigrationInterface {
  name = 'RestrictLedgerCascadeDeletes1760000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        SELECT tc.constraint_name INTO constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'ledger_entries'
          AND kcu.column_name = 'transactionId'
        LIMIT 1;

        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE "ledger_entries" DROP CONSTRAINT %I', constraint_name);
        END IF;

        ALTER TABLE "ledger_entries"
        ADD CONSTRAINT "FK_ledger_entries_transaction_restrict"
        FOREIGN KEY ("transactionId") REFERENCES "transactions"("id")
        ON DELETE RESTRICT;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        SELECT tc.constraint_name INTO constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'ledger_entries'
          AND kcu.column_name = 'walletId'
        LIMIT 1;

        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE "ledger_entries" DROP CONSTRAINT %I', constraint_name);
        END IF;

        ALTER TABLE "ledger_entries"
        ADD CONSTRAINT "FK_ledger_entries_wallet_restrict"
        FOREIGN KEY ("walletId") REFERENCES "wallets"("id")
        ON DELETE RESTRICT;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ledger_entries"
      DROP CONSTRAINT IF EXISTS "FK_ledger_entries_transaction_restrict";
      ALTER TABLE "ledger_entries"
      ADD CONSTRAINT "FK_ledger_entries_transaction_cascade"
      FOREIGN KEY ("transactionId") REFERENCES "transactions"("id")
      ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "ledger_entries"
      DROP CONSTRAINT IF EXISTS "FK_ledger_entries_wallet_restrict";
      ALTER TABLE "ledger_entries"
      ADD CONSTRAINT "FK_ledger_entries_wallet_cascade"
      FOREIGN KEY ("walletId") REFERENCES "wallets"("id")
      ON DELETE CASCADE;
    `);
  }
}
