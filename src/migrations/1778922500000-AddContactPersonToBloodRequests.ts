import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactPersonToBloodRequests1778922500000 implements MigrationInterface {
  name = 'AddContactPersonToBloodRequests1778922500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blood_requests" ADD "relationshipToPatient" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "blood_requests" ADD "contactNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "blood_requests" ADD "contactName" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blood_requests" DROP COLUMN "contactName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blood_requests" DROP COLUMN "contactNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blood_requests" DROP COLUMN "relationshipToPatient"`,
    );
  }
}
