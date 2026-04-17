import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../../users/users.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>("JWT_SECRET") || "secret_key";
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      issuer: configService.get<string>("JWT_ISSUER") || "BLOOD-MATCH-API",
      audience:
        configService.get<string>("JWT_AUDIENCE") || "BLOOD-MATCH-API-CLIENT",
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException("Invalid token");
      }
      const { password, ...result } = user;
      return result;
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
