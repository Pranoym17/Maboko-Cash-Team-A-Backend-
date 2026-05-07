import { MigrationInterface, QueryRunner } from 'typeorm';

export class UssdUserIdentity1760000002000 implements MigrationInterface {
  name = 'UssdUserIdentity1760000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "phoneNumber" character varying,
      ADD COLUMN IF NOT EXISTS "ussdPinHash" character varying,
      ADD COLUMN IF NOT EXISTS "ussdEnabled" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "ussdPinUpdatedAt" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "ussdFailedPinAttempts" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "ussdLockedUntil" TIMESTAMPTZ
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_phoneNumber_unique"
      ON "users" ("phoneNumber")
      WHERE "phoneNumber" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ussd_transaction_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sessionId" character varying NOT NULL,
        "textHash" character varying NOT NULL,
        "idempotencyKey" character varying NOT NULL,
        "phoneNumber" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "response" text,
        "transactionReference" character varying,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ussd_transaction_requests_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ussd_transaction_requests_idempotencyKey"
      ON "ussd_transaction_requests" ("idempotencyKey")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ussd_transaction_requests_idempotencyKey"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "ussd_transaction_requests"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_users_phoneNumber_unique"`,
    );
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "ussdLockedUntil",
      DROP COLUMN IF EXISTS "ussdFailedPinAttempts",
      DROP COLUMN IF EXISTS "ussdPinUpdatedAt",
      DROP COLUMN IF EXISTS "ussdEnabled",
      DROP COLUMN IF EXISTS "ussdPinHash",
      DROP COLUMN IF EXISTS "phoneNumber"
    `);
  }
}
