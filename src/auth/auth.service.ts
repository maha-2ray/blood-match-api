import {
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
import { OtpCode } from './otp-code.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(OtpCode)
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(phone: string, passcode: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { phone: phone },
    });
    if (user?.password) {
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
        throw new ConflictException('Phone number already in use');
      }
      if (existingUser.email === registerStartDto.email?.trim().toLowerCase()) {
        throw new ConflictException('Email already in use');
      }
    }
    const user = this.usersRepository.create({
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
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.phone || !user.email) {
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
      phone: user.phone,
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
        phoneVerifiedAt: user.phoneVerifiedAt,
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
        phone: decoded.phone,
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
}
