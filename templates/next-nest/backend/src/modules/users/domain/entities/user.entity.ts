import { InvalidUserDataException } from '../exceptions/user.exceptions';

export interface UserProps {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export class User {
  readonly id: string;

  readonly email: string;

  readonly name: string;

  readonly passwordHash: string;


  private constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.name = props.name;
    this.passwordHash = props.passwordHash;
  }

  static create(props: UserProps): User {
    if (!props.email.includes('@')) {
      throw new InvalidUserDataException('email must contain "@"');
    }
    if (props.name.trim().length === 0) {
      throw new InvalidUserDataException('name cannot be empty');
    }
    if (props.passwordHash.length === 0) {
      throw new InvalidUserDataException('password hash cannot be empty');
    }
    return new User(props);
  }

  rename(name: string): User {
    return User.create({ ...this, name, updatedAt: new Date() });
  }

  changePassword(passwordHash: string): User {
    return User.create({ ...this, passwordHash, updatedAt: new Date() });
  }
}
