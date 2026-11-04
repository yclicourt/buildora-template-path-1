import { Module } from '@nestjs/common';
import { UsersController } from './infrastructure/http/users.controller';
import { CreateUserUseCase } from './application/uses-cases/create-user.use-case';
import { DeleteUserUseCase } from './application/uses-cases/delete-user.use-case';
import { GetUserUseCase } from './application/uses-cases/get-user.use-case';
import { ListUsersUseCase } from './application/uses-cases/list-users.use-case';
import { UpdateUserUseCase } from './application/uses-cases/update-user.use-case';
import { USER_REPOSITORY } from './domain/ports/user.repository';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { PrismaModule } from '@/shared/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    GetUserUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
  ],
  exports: [GetUserUseCase],
})
export class UsersModule {}
