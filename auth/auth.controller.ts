import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterStartDto } from "./dto/register-start.dto";
import { VerifyCodeDto } from "./dto/verify-code.dto";
import { SetPasscodeDto } from "./dto/set-passcode.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register/start")
  registerStart(@Body() registerStartDto: RegisterStartDto) {
    return this.authService.registerStart(registerStartDto);
  }

  @Post("register/verify")
  registerVerify(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.authService.registerVerify(verifyCodeDto);
  }

  @Post("register/passcode")
  registerSetPasscode(@Body() setPasscodeDto: SetPasscodeDto) {
    return this.authService.registerSetPasscode(setPasscodeDto);
  }

  @Post("login")
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getProfile(@Request() req: any) {
    return req.user;
  }
}
