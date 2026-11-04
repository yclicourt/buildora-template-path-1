import { User } from '../../domain/entities/user.entity';
import type { NewUserRow, UserRow } from './user.schema';

export const UserMapper = {
  toDomain(row: UserRow): User {
    return User.create({
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password,
    });
  },

  toPersistence(user: User): NewUserRow {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      password: user.passwordHash,
    };
  },
};
