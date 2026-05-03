import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { User } from "../users/user.entity";
import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";

@ValidatorConstraint({ async: true })
@Injectable()
export class UsernameValidator implements ValidatorConstraintInterface {
  constructor(private readonly userRepository: Repository<User>) {}
  async validate(username: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { username } as any,
    });
    return Promise.resolve(!user);
  }

  defaultMessage(): string {
    return "Username $value is already taken. Please choose another one.";
  }
}
