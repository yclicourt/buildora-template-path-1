import { Module } from '@nestjs/common';
import { AuthController } from './infrastructure/http/auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { LoginUseCase } from './application/uses-cases/login.use-case';
import { LogoutUseCase } from './application/uses-cases/logout.use-case';
import { RefreshTokenUseCase } from './application/uses-cases/refresh-token.use-case';
import { TOKEN_SERVICE } from './domain/ports/token.service';
import { TokenIssuer } from './application/services/token-issuer.service';
import { JwtTokenService } from './infrastructure/services/jwt-token.service';
import { REFRESH_TOKEN_REPOSITORY } from './domain/ports/refresh-token.repository';
import { JwtAuthGuard } from './infrastructure/http/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { PrismaAuthRepository } from './infrastructure/persistence/prisma-auth.repository';
import { PASSWORD_HASHER } from '@/shared/security/security.token';
import { BcryptPasswordHasher } from '@/shared/security/adapters/bcrypt-password-hasher';
import { USER_REPOSITORY } from '../users/domain/ports/user.repository';
import { PrismaUserRepository } from '../users/infrastructure/persistence/prisma-user.repository';
import { PrismaModule } from '@/shared/database/prisma.module';

@Module({
  imports: [UsersModule, JwtModule, PrismaModule],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    LogoutUseCase,
    RefreshTokenUseCase,
    TokenIssuer,
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaAuthRepository },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
  ],
})
export class AuthModule {}
