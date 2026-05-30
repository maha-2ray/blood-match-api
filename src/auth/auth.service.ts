import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterStartDto } from './dto/register-start.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { OtpCode, OtpPurpose } from './otp-code.entity';
import { PendingRegistration } from './pending-registration.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { randomInt } from 'crypto';

@Injectable()
export class AuthService {
  private readonly otpExpiryMinutes = 10;
  private readonly maxOtpAttempts = 5;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(OtpCode)
    private readonly otpCodesRepository: Repository<OtpCode>,
    @InjectRepository(PendingRegistration)
    private readonly pendingRegistrationsRepository: Repository<PendingRegistration>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { email: email },
    });
    if (user?.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async registerUser(registerStartDto: RegisterStartDto) {
    const email = registerStartDto.email.trim().toLowerCase();
    const phone = registerStartDto.phone?.trim();
    const role = registerStartDto.role ?? UserRole.DONOR;

    if (role === UserRole.ADMIN) {
      throw new BadRequestException('Admin accounts cannot self-register');
    }

    const existingUser = await this.usersRepository.findOne({
      where: [{ email }, ...(phone ? [{ phone }] : [])],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already in use');
      }
      throw new ConflictException('Phone already in use');
    }

    const password = await bcrypt.hash(registerStartDto.password, 10);
    const pendingExpiresAt = this.minutesFromNow(this.otpExpiryMinutes);

    const existingPending = await this.pendingRegistrationsRepository.findOneBy(
      { email },
    );

    const pendingRegistration =
      existingPending ??
      this.pendingRegistrationsRepository.create({
        email,
      });

    Object.assign(pendingRegistration, {
      fullName: registerStartDto.fullName,
      password,
      phone,
      role,
      expiresAt: pendingExpiresAt,
    });

    await this.pendingRegistrationsRepository.save(pendingRegistration);

    await this.otpCodesRepository.update(
      { email, purpose: OtpPurpose.REGISTER, isUsed: false },
      { isUsed: true },
    );

    const code = this.generateSixDigitCode();
    const codeHash = await bcrypt.hash(code, 10);

    await this.otpCodesRepository.save(
      this.otpCodesRepository.create({
        email,
        purpose: OtpPurpose.REGISTER,
        codeHash,
        expiresAt: this.minutesFromNow(this.otpExpiryMinutes),
      }),
    );

    await this.mailService.sendRegistrationCode(email, code);

    return {
      message: 'Verification code sent to email',
      email,
    };
  }

  async verifyRegistrationCode(verifyCodeDto: VerifyCodeDto) {
    const email = verifyCodeDto.email.trim().toLowerCase();
    const pendingRegistration =
      await this.pendingRegistrationsRepository.findOneBy({ email });

    if (!pendingRegistration || pendingRegistration.expiresAt < new Date()) {
      throw new BadRequestException(
        'Registration request expired. Please register again.',
      );
    }

    const otpCode = await this.otpCodesRepository.findOne({
      where: {
        email,
        purpose: OtpPurpose.REGISTER,
        isUsed: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (!otpCode || otpCode.expiresAt < new Date()) {
      throw new BadRequestException(
        'Verification code expired. Please request a new code.',
      );
    }

    if (otpCode.attempts >= this.maxOtpAttempts) {
      throw new BadRequestException(
        'Too many invalid attempts. Please request a new code.',
      );
    }

    const isCodeValid = await bcrypt.compare(
      verifyCodeDto.code,
      otpCode.codeHash,
    );

    if (!isCodeValid) {
      otpCode.attempts += 1;
      await this.otpCodesRepository.save(otpCode);
      throw new BadRequestException('Invalid verification code');
    }

    const savedUser = await this.usersRepository.manager.transaction(
      async (manager) => {
        const usersRepository = manager.getRepository(User);
        const otpCodesRepository = manager.getRepository(OtpCode);
        const pendingRegistrationsRepository =
          manager.getRepository(PendingRegistration);

        const existingUser = await usersRepository.findOne({
          where: [
            { email },
            ...(pendingRegistration.phone
              ? [{ phone: pendingRegistration.phone }]
              : []),
          ],
        });

        if (existingUser) {
          throw new ConflictException('User already exists');
        }

        const user = usersRepository.create({
          email: pendingRegistration.email,
          fullName: pendingRegistration.fullName,
          password: pendingRegistration.password,
          ...(pendingRegistration.phone && {
            phone: pendingRegistration.phone,
          }),
          role: pendingRegistration.role,
          isActive: true,
        });

        const createdUser = await usersRepository.save(user);
        otpCode.isUsed = true;
        await otpCodesRepository.save(otpCode);
        await pendingRegistrationsRepository.delete({
          id: pendingRegistration.id,
        });

        return createdUser;
      },
    );

    return {
      id: savedUser.id,
      email: savedUser.email,
      fullName: savedUser.fullName,
      role: savedUser.role,
    };
  }

  async login(loginDto: LoginDto) {
    let user: User | null = null;
    if (loginDto.email) {
      user = await this.usersRepository.findOne({
        where: {
          email: loginDto.email?.trim().toLowerCase(),
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.email) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    if (!user?.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      fullName: user.fullName,
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const user = await this.usersRepository.findOne({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      const payload = {
        fullName: decoded.fullName,
        email: decoded.email,
        sub: decoded.sub,
        role: decoded.role,
      };
      const accessToken = this.jwtService.sign(payload);
      return { access_token: accessToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private generateSixDigitCode(): string {
    return randomInt(100000, 1000000).toString();
  }

  private minutesFromNow(minutes: number): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }
}
