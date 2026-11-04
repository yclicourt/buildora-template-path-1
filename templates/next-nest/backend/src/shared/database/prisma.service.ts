import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Database connection successfully');
    } catch (error) {
      console.error('❌ Error to connect with database:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
