import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";
import { RegisterStartDto } from "./dto/register-start.dto";
import { VerifyCodeDto } from "./dto/verify-code.dto";
import { SetPasscodeDto } from "./dto/set-passcode.dto";
import { User, UserRole } from "../users/user.entity";
import { OtpCode, OtpPurpose } from "./otp-code.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(OtpCode)
    private otpCodeRepository: Repository<OtpCode>,
    private jwtService: JwtService,
  ) {}

  async validateUser(phone: string, passcode: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { phone: phone },
    });
    if (user && user.password) {
      const isMatch = await bcrypt.compare(passcode, user.password);
      if (isMatch) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async registerUser(registerStartDto: RegisterStartDto) {
    const existingUser = await this.usersRepository.findOne({
      where: [
        { phone: registerStartDto.phone },
        { email: registerStartDto.email?.trim().toLowerCase() },
      ],
    });

    if (existingUser) {
      if (existingUser.phone === registerStartDto.phone) {
        throw new ConflictException("Phone number already in use");
      }
      if (
        registerStartDto.email &&
        existingUser.email === registerStartDto.email.trim().toLowerCase()
      ) {
        throw new ConflictException("Email already in use");
      }
    }
    const user = await this.usersRepository.create({
      email: registerStartDto.email?.trim().toLowerCase(),
      phone: registerStartDto.phone,
      fullName: registerStartDto.fullName,
      role: UserRole.ADMIN,
      isActive: true,
    });

    if (registerStartDto.password) {
      user.password = await bcrypt.hash(registerStartDto.password, 10);
    }

    const savedUser = await this.usersRepository.save(user);

    return {
      id: savedUser.id,
      email: savedUser.email,
      fullName: savedUser.fullName,
      role: savedUser.role,
      phone: savedUser.phone,
      phoneVerifiedAt: savedUser.phoneVerifiedAt,
    };
  }

  /*async registerVerify(verifyCodeDto: VerifyCodeDto) {
    const phone = this.normalizePhone(verifyCodeDto.phone);
    const otpRecord = await this.validateOtp(
      phone,
      verifyCodeDto.code,
      OtpPurpose.REGISTER,
    );

    const user = await this.usersRepository.findOne({ where: { phone } });
    if (!user) {
      throw new BadRequestException(
        "Registration session expired. Start again.",
      );
    }

    user.phoneVerifiedAt = new Date();
    await this.usersRepository.save(user);

    otpRecord.isUsed = true;
    await this.otpCodeRepository.save(otpRecord);

    return {
      message:
        "Phone number verified. Set your passcode to finish registration.",
      phone,
    };
  }*/

  /*async registerSetPasscode(setPasscodeDto: SetPasscodeDto) {
    const phone = this.normalizePhone(setPasscodeDto.phone);
    const user = await this.usersRepository.findOne({ where: { phone } });

    if (!user || !user.phoneVerifiedAt) {
      throw new BadRequestException("Phone is not verified yet");
    }

    user.password = await bcrypt.hash(setPasscodeDto.passcode, 10);
    await this.usersRepository.save(user);

    return this.buildAuthResponse(user);
  }*/

  async login(loginDto: LoginDto) {
    let user: User | null = null;
    if (loginDto.phone || loginDto.email) {
      user = await this.usersRepository.findOne({
        where: {
          phone: loginDto.phone,
          email: loginDto.email?.trim().toLowerCase(),
        },
      });

      if (!user) {
        throw new UnauthorizedException("Invalid credentials");
      }

      if (!user.phone || !user.email) {
        throw new UnauthorizedException("Invalid credentials");
      }
    }

    if (!user?.password) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isValidPassword) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload = {
      phone: user.phone,
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        phoneVerifiedAt: user.phoneVerifiedAt,
      },
    };
  }

  /*private buildAuthResponse(user: User) {
    const payload = {
      phone: user.phone,
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        phoneVerifiedAt: user.phoneVerifiedAt,
      },
    };
  }*/

  /*private async issueOtp(phone: string, purpose: OtpPurpose) {
    await this.otpCodeRepository.update(
      { phone, purpose, isUsed: false },
      { isUsed: true },
    );

    const code = this.generateVerificationCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresInSeconds = 5 * 60;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const otp = this.otpCodeRepository.create({
      phone,
      purpose,
      codeHash,
      expiresAt,
    });
    await this.otpCodeRepository.save(otp);

    this.sendSmsCode(phone, code);

    return {
      expiresInSeconds,
      debugCode: process.env.NODE_ENV === "production" ? undefined : code,
    };
  }

  private async validateOtp(
    phone: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<OtpCode> {
    const otp = await this.otpCodeRepository.findOne({
      where: { phone, purpose, isUsed: false },
      order: { createdAt: "DESC" },
    });

    if (!otp) {
      throw new UnauthorizedException("Verification code not found");
    }

    if (otp.expiresAt.getTime() < Date.now()) {
      otp.isUsed = true;
      await this.otpCodeRepository.save(otp);
      throw new UnauthorizedException("Verification code expired");
    }

    const matches = await bcrypt.compare(code, otp.codeHash);
    if (!matches) {
      otp.attempts += 1;
      if (otp.attempts >= 5) {
        otp.isUsed = true;
      }
      await this.otpCodeRepository.save(otp);
      throw new UnauthorizedException("Invalid verification code");
    }

    return otp;
  }

  private generateVerificationCode(): string {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
  }

  private sendSmsCode(phone: string, code: string) {
    // Replace this with real SMS integration (Twilio/Africa's Talking/Infobip).
    console.log(`OTP code for ${phone}: ${code}`);
  }

  private normalizePhone(phone: string): string {
    return phone.trim().replace(/\s+/g, "");
  }

  // Placeholder for optional OTP-based login extension.
  async requestLoginCode(phone: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const user = await this.usersRepository.findOne({
      where: { phone: normalizedPhone },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.issueOtp(normalizedPhone, OtpPurpose.LOGIN);
  }*/
}
