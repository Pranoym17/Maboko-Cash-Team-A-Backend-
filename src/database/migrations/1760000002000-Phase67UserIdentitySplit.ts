import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase67UserIdentitySplit1760000002000 implements MigrationInterface {
  name = 'Phase67UserIdentitySplit1760000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "firstName" character varying NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS "lastName" character varying NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS "phone" character varying
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_users_phone'
        ) THEN
          ALTER TABLE "users" ADD CONSTRAINT "UQ_users_phone" UNIQUE ("phone");
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET
        "firstName" = CASE
          WHEN COALESCE(BTRIM("fullName"), '') = '' THEN ''
          ELSE SPLIT_PART(BTRIM("fullName"), ' ', 1)
        END,
        "lastName" = CASE
          WHEN COALESCE(BTRIM("fullName"), '') = '' THEN ''
          WHEN POSITION(' ' IN BTRIM("fullName")) > 0 THEN BTRIM(SUBSTRING("fullName" FROM POSITION(' ' IN BTRIM("fullName")) + 1))
          ELSE ''
        END
      WHERE COALESCE(BTRIM("fullName"), '') <> ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_users_phone'
        ) THEN
          ALTER TABLE "users" DROP CONSTRAINT "UQ_users_phone";
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "phone",
      DROP COLUMN IF EXISTS "lastName",
      DROP COLUMN IF EXISTS "firstName"
    `);
  }
}