import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactFieldsToDonors1778921000000
  implements MigrationInterface
{
  name = 'AddContactFieldsToDonors1778921000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "donors" ADD "email" character varying`);
    await queryRunner.query(`ALTER TABLE "donors" ADD "phone" character varying`);
    await queryRunner.query(
      `ALTER TABLE "donors" ADD "fullName" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "donors" DROP COLUMN "fullName"`);
    await queryRunner.query(`ALTER TABLE "donors" DROP COLUMN "phone"`);
    await queryRunner.query(`ALTER TABLE "donors" DROP COLUMN "email"`);
  }
}
