import { Injectable } from '@nestjs/common';
import {
  RefreshTokenRecord,
  RefreshTokenRepository,
} from '../../domain/ports/refresh-token.repository';
import { PrismaService } from '@/shared/database/prisma.service';
import { AuthPayload } from './refresh-token-schema';

@Injectable()
export class PrismaAuthRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}
  async save(record: RefreshTokenRecord): Promise<void> {
    await this.prisma.auth.create({
      data: {
        jti: record.jti,
        userId: record.userId,
        familyId: record.familyId,
        tokenHash: record.tokenHash,
        expiresAt: record.expiresAt,
        revokedAt: record.revokedAt ?? null,
        createdAt: record.createdAt,
      },
    });
  }
  async findByJti(jti: string): Promise<RefreshTokenRecord | null> {
    const row = await this.prisma.auth.findUnique({ where: { jti } });
    return row ? this.toRecord(row) : null;
  }
  async revoke(jti: string): Promise<void> {
    await this.prisma.auth.update({
      where: { jti },
      data: { revokedAt: new Date() },
    });
  }
  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.auth.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private toRecord(row: AuthPayload): RefreshTokenRecord {
    return {
      jti: row.jti,
      userId: row.userId,
      familyId: row.familyId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt ?? null,
      createdAt: row.createdAt,
    };
  }
}
