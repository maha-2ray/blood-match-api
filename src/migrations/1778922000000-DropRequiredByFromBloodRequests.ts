import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropRequiredByFromBloodRequests1778922000000 implements MigrationInterface {
  name = 'DropRequiredByFromBloodRequests1778922000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blood_requests" DROP COLUMN IF EXISTS "requiredBy"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blood_requests" ADD "requiredBy" TIMESTAMP`,
    );
    await queryRunner.query(
      `UPDATE "blood_requests" SET "requiredBy" = "createdAt" WHERE "requiredBy" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "blood_requests" ALTER COLUMN "requiredBy" SET NOT NULL`,
    );
  }
}
