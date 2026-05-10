import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';

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
    return 'Username $value is already taken. Please choose another one.';
  }
}
