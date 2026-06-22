import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGenderToBloodRequests1778921500000 implements MigrationInterface {
  name = 'AddGenderToBloodRequests1778921500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blood_requests" ADD "gender" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blood_requests" DROP COLUMN "gender"`,
    );
  }
}
