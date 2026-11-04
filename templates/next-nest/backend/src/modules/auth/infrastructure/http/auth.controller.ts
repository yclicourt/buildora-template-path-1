import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUserUseCase } from '@modules/users/application/uses-cases/get-user.use-case';
import { UserResponse } from '@modules/users/application/dtos/user.response';
import { LoginDto } from '../../application/dto/login.dto';
import { RefreshTokenDto } from '../../application/dto/refresh-token.dto';
import { TokenPairResponse } from '../../application/dto/token-pair.response';
import { LoginUseCase } from '../../application/uses-cases/login.use-case';
import { LogoutUseCase } from '../../application/uses-cases/logout.use-case';
import { RefreshTokenUseCase } from '../../application/uses-cases/refresh-token.use-case';
import { CurrentUser, type AuthenticatedUser } from './current-user.decorator';
import { Public } from './public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly refresh: RefreshTokenUseCase,
    private readonly logout: LogoutUseCase,
    private readonly getUser: GetUserUseCase,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email + password' })
  async loginHandler(@Body() dto: LoginDto): Promise<TokenPairResponse> {
    const pair = await this.login.execute(dto);
    return TokenPairResponse.fromDomain(pair);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange a refresh token for a new token pair (rotates)',
  })
  async refreshHandler(
    @Body() dto: RefreshTokenDto,
  ): Promise<TokenPairResponse> {
    const pair = await this.refresh.execute(dto);
    return TokenPairResponse.fromDomain(pair);
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a refresh token family (logout)' })
  async logoutHandler(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.logout.execute(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  async me(@CurrentUser() current: AuthenticatedUser): Promise<UserResponse> {
    const user = await this.getUser.execute(current.id);
    return UserResponse.fromDomain(user);
  }
}
