import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillUserIdentityContact1760000004000
  implements MigrationInterface
{
  name = 'BackfillUserIdentityContact1760000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users"
      SET
        "phone" = COALESCE("phone", "phoneNumber"),
        "phoneNumber" = COALESCE("phoneNumber", "phone"),
        "fullName" = CASE
          WHEN COALESCE(BTRIM("fullName"), '') = '' THEN
            CASE
              WHEN COALESCE(BTRIM("firstName"), '') = '' AND COALESCE(BTRIM("lastName"), '') = '' THEN ''
              ELSE BTRIM(CONCAT_WS(' ', "firstName", "lastName"))
            END
          ELSE "fullName"
        END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users"
      SET
        "phone" = NULL,
        "fullName" = COALESCE("fullName", '')
    `);
  }
}