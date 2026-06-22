import 'reflect-metadata';
import dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

import dataSource from './datasource';
import { User, UserRole } from '../users/entities/user.entity';

dotenv.config();

const normalizeEmail = (value?: string) => value?.trim().toLowerCase();

async function seedAdminUser() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL) ?? 'admin@bloodmatch.com';
  const password = process.env.ADMIN_PASSWORD ?? '3810819m';
  const fullName = process.env.ADMIN_FULL_NAME?.trim() ?? 'System Admin';
  const phone = process.env.ADMIN_PHONE?.trim();

  await dataSource.initialize();

  try {
    const usersRepository = dataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash(password, 10);

    let adminUser = await usersRepository.findOne({
      where: { email },
    });

    if (!adminUser && phone) {
      adminUser = await usersRepository.findOne({
        where: { phone },
      });
    }

    if (adminUser) {
      adminUser.email = email;
      adminUser.fullName = fullName;
      adminUser.password = hashedPassword;
      adminUser.phone = phone ?? adminUser.phone;
      adminUser.role = UserRole.ADMIN;
      adminUser.isActive = true;

      await usersRepository.save(adminUser);
      console.log(`Admin user updated: ${email}`);
      return;
    }

    const createdAdmin = usersRepository.create({
      email,
      password: hashedPassword,
      fullName,
      phone,
      role: UserRole.ADMIN,
      isActive: true,
    });

    await usersRepository.save(createdAdmin);
    console.log(`Admin user created: ${email}`);
  } finally {
    await dataSource.destroy();
  }
}

seedAdminUser().catch((error) => {
  console.error('Failed to seed admin user');
  console.error(error);
  process.exit(1);
});
