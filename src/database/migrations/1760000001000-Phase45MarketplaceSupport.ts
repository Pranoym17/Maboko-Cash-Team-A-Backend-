import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase45MarketplaceSupport1760000001000
  implements MigrationInterface
{
  name = 'Phase45MarketplaceSupport1760000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'marketplace_providers_status_enum'
        ) THEN
          CREATE TYPE "marketplace_providers_status_enum" AS ENUM (
            'active',
            'pending',
            'disabled'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "marketplace_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text NOT NULL,
        "rolloutPhase" integer NOT NULL DEFAULT 1,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_marketplace_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_marketplace_categories_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "marketplace_providers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "description" text,
        "integrationType" character varying NOT NULL,
        "apiBaseUrl" character varying,
        "authType" character varying,
        "status" "marketplace_providers_status_enum" NOT NULL DEFAULT 'pending',
        "isVisible" boolean NOT NULL DEFAULT true,
        "supportsAccountLinking" boolean NOT NULL DEFAULT false,
        "averageConfirmationSeconds" integer NOT NULL DEFAULT 2,
        "metadataJson" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "categoryId" uuid,
        CONSTRAINT "PK_marketplace_providers_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_marketplace_providers_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_marketplace_providers_categoryId'
        ) THEN
          ALTER TABLE "marketplace_providers"
          ADD CONSTRAINT "FK_marketplace_providers_categoryId"
          FOREIGN KEY ("categoryId") REFERENCES "marketplace_categories"("id") ON DELETE CASCADE;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'support_conversations_category_enum'
        ) THEN
          CREATE TYPE "support_conversations_category_enum" AS ENUM (
            'password_reset',
            'payment_issue',
            'transaction_error',
            'account_verification',
            'marketplace_issue',
            'other'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'support_conversations_status_enum'
        ) THEN
          CREATE TYPE "support_conversations_status_enum" AS ENUM (
            'open',
            'pending',
            'resolved',
            'escalated'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'support_conversations_priority_enum'
        ) THEN
          CREATE TYPE "support_conversations_priority_enum" AS ENUM (
            'low',
            'medium',
            'high',
            'urgent'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" character varying NOT NULL,
        "assignedAdminId" character varying,
        "subject" character varying NOT NULL,
        "category" "support_conversations_category_enum" NOT NULL DEFAULT 'other',
        "status" "support_conversations_status_enum" NOT NULL DEFAULT 'open',
        "priority" "support_conversations_priority_enum" NOT NULL DEFAULT 'medium',
        "lastMessageAt" TIMESTAMPTZ,
        "resolvedAt" TIMESTAMPTZ,
        "escalatedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_support_conversations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'support_messages_senderrole_enum'
        ) THEN
          CREATE TYPE "support_messages_senderrole_enum" AS ENUM (
            'user',
            'admin',
            'system'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'support_messages_messagetype_enum'
        ) THEN
          CREATE TYPE "support_messages_messagetype_enum" AS ENUM (
            'text',
            'system_event'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "senderUserId" character varying,
        "senderAdminId" character varying,
        "senderRole" "support_messages_senderrole_enum" NOT NULL,
        "message" text NOT NULL,
        "messageType" "support_messages_messagetype_enum" NOT NULL DEFAULT 'text',
        "isInternalNote" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "conversationId" uuid,
        CONSTRAINT "PK_support_messages_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_support_messages_conversationId'
        ) THEN
          ALTER TABLE "support_messages"
          ADD CONSTRAINT "FK_support_messages_conversationId"
          FOREIGN KEY ("conversationId") REFERENCES "support_conversations"("id") ON DELETE CASCADE;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "support_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_conversations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "marketplace_providers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "marketplace_categories"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "support_messages_messagetype_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "support_messages_senderrole_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "support_conversations_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "support_conversations_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "support_conversations_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "marketplace_providers_status_enum"`);
  }
}
