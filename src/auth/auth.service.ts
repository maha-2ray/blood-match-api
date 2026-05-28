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
    private readonly jwtService: JwtService,
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
    const existingUser = await this.usersRepository.findOne({
      where: [{ email: registerStartDto.email?.trim().toLowerCase() }],
    });

    if (existingUser) {
      if (existingUser.email === registerStartDto.email?.trim().toLowerCase()) {
        throw new ConflictException('Email already in use');
      }
    }
    const user = this.usersRepository.create({
      email: registerStartDto.email?.trim().toLowerCase(),
      fullName: registerStartDto.fullName,
      ...(registerStartDto.phone && { phone: registerStartDto.phone }),
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
}
