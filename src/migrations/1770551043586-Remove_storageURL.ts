import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveStorageURL1770551043586 implements MigrationInterface {
    name = 'RemoveStorageURL1770551043586'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "receipts" DROP COLUMN "storageUrl"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "receipts" ADD "storageUrl" character varying`);
    }

}
