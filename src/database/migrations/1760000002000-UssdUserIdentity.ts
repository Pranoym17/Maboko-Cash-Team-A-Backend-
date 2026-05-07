import { MigrationInterface, QueryRunner } from 'typeorm';

export class UssdUserIdentity1760000002000 implements MigrationInterface {
  name = 'UssdUserIdentity1760000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "phoneNumber" character varying,
      ADD COLUMN IF NOT EXISTS "ussdPinHash" character varying,
      ADD COLUMN IF NOT EXISTS "ussdEnabled" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "ussdPinUpdatedAt" TIMESTAMPTZ
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_phoneNumber_unique"
      ON "users" ("phoneNumber")
      WHERE "phoneNumber" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_users_phoneNumber_unique"`,
    );
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "ussdPinUpdatedAt",
      DROP COLUMN IF EXISTS "ussdEnabled",
      DROP COLUMN IF EXISTS "ussdPinHash",
      DROP COLUMN IF EXISTS "phoneNumber"
    `);
  }
}
