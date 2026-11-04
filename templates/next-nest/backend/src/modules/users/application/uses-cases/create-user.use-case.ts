import { PrismaService } from '@/shared/database/prisma.service';
import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/ports/user.repository';
import { UserAlreadyExistsException } from '../../domain/exceptions/user.exceptions';
import * as bcryptjs from 'bcryptjs';
import { randomUUID } from 'crypto';
import { User } from '../../domain/entities/user.entity';
import { PASSWORD_HASHER } from '@/shared/security/security.token';
import { PasswordHasher } from '@/shared/security/ports/password-hasher.service';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(createUserDto: CreateUserDto) {
    const existing = await this.userRepository.findByEmail(createUserDto.email);
    if (existing) {
      throw new UserAlreadyExistsException(createUserDto.email);
    }
    const now = new Date();
    const passwordHash = await this.hasher.hash(createUserDto.password);
    const user = User.create({
      id: randomUUID(),
      email: createUserDto.email,
      name: createUserDto.name,
      passwordHash,
    });
    const saved = await this.userRepository.create(user);
    return saved;
  }
}
