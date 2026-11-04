import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserResponse } from '../../application/dtos/user.response';
import { CreateUserDto } from '../../application/dtos/create-user.dto';
import { ApiOperation } from '@nestjs/swagger';
import { CreateUserUseCase } from '../../application/uses-cases/create-user.use-case';
import { UpdateUserDto } from '../../application/dtos/update-user.dto';
import { DeleteUserUseCase } from '../../application/uses-cases/delete-user.use-case';
import { GetUserUseCase } from '../../application/uses-cases/get-user.use-case';
import { ListUsersUseCase } from '../../application/uses-cases/list-users.use-case';
import { UpdateUserUseCase } from '../../application/uses-cases/update-user.use-case';
import {
  AuthenticatedUser,
  CurrentUser,
} from '@/modules/auth/infrastructure/http/current-user.decorator';
import { Public } from '@/modules/auth/infrastructure/http/public.decorator';

@Controller('users')
export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly deleteUser: DeleteUserUseCase,
  ) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponse> {
    const user = await this.createUser.execute(dto);
    return UserResponse.fromDomain(user);
  }

  @Get()
  @ApiOperation({ summary: 'List users' })
  async list(): Promise<UserResponse[]> {
    const users = await this.listUsers.execute();
    return users.map(UserResponse.fromDomain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  async getOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponse> {
    const user = await this.getUser.execute(id);
    return UserResponse.fromDomain(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user (owner only)' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() current: AuthenticatedUser,
  ): Promise<UserResponse> {
    const user = await this.updateUser.execute(id, dto, current.id);
    return UserResponse.fromDomain(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user (owner only)' })
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() current: AuthenticatedUser,
  ): Promise<void> {
    await this.deleteUser.execute(id, current.id);
  }
}
