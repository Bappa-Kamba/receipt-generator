import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReceiptStatusEnum1770493641875 implements MigrationInterface {
    name = 'AddReceiptStatusEnum1770493641875'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "receipts" ADD "storageKey" character varying`);
        await queryRunner.query(`CREATE TYPE "public"."receipts_status_enum" AS ENUM('PENDING', 'PDF_UPLOADED', 'EMAIL_SENT', 'FAILED')`);
        await queryRunner.query(`ALTER TABLE "receipts" ADD "status" "public"."receipts_status_enum" NOT NULL DEFAULT 'PENDING'`);
        await queryRunner.query(`ALTER TABLE "receipts" ADD "lastError" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "receipts" DROP COLUMN "lastError"`);
        await queryRunner.query(`ALTER TABLE "receipts" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."receipts_status_enum"`);
        await queryRunner.query(`ALTER TABLE "receipts" DROP COLUMN "storageKey"`);
    }

}
