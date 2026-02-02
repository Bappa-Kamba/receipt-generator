import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameStorageUrl1770060174843 implements MigrationInterface {
    name = 'RenameStorageUrl1770060174843'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "receipts" RENAME COLUMN "cloudinaryUrl" TO "storageUrl"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "receipts" RENAME COLUMN "storageUrl" TO "cloudinaryUrl"`);
    }

}
