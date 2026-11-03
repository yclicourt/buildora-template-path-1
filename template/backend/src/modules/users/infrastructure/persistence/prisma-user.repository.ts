import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/ports/user.repository';
import { UserMapper } from './user.mapper';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(): Promise<User[]> {
    const rows = await this.prisma.user.findMany();
    return rows.map(UserMapper.toDomain);
  }
  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async create(user: User): Promise<User> {
    const row = await this.prisma.user.create({
      data: UserMapper.toPersistence(user),
    });
    return UserMapper.toDomain(row);
  }
  
  async update(user: User): Promise<User> {
    const userExists = await this.findById(user.id);
    if (!userExists) throw new NotFoundException('User not found');

    const userUpdated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        email: user.email,
        password: user.passwordHash,
      },
    });
    return UserMapper.toDomain(userUpdated);
  }
  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
