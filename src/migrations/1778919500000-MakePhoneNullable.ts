import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakePhoneNullable1778919500000 implements MigrationInterface {
  name = 'MakePhoneNullable1778919500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL`,
    );
  }
}
