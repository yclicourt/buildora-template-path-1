import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './shared/database/prisma.module';
import { SecurityModule } from './shared/security/security.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    PrismaModule,
    SecurityModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
