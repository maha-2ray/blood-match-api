import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OtpCode } from './otp-code.entity';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { PendingRegistration } from './pending-registration.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    UsersModule,
    MailModule,
    PassportModule,
    TypeOrmModule.forFeature([User, OtpCode, PendingRegistration]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'secret_key',
        signOptions: {
          expiresIn: '7d',
          issuer: configService.get('JWT_ISSUER') || 'BLOOD-MATCH-API',
          audience:
            configService.get('JWT_AUDIENCE') || 'BLOOD-MATCH-API-CLIENT',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
