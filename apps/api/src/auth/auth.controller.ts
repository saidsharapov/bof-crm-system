import { Controller, Post, Body, UseGuards, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login' })
  async login(@Body() dto: LoginDto) {
    const user = await this.auth.validateUser(dto.login, dto.password);
    return this.auth.login(user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh tokens' })
  async refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout' })
  async logout(@CurrentUser('id') userId: string, @Body() body: { refresh_token?: string }) {
    await this.auth.logout(userId, body.refresh_token);
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user' })
  async me(@CurrentUser() user: any) {
    return { id: user.id, login: user.login, role: user.role, name: user.name };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  async changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    await this.auth.changePassword(userId, dto.current, dto.next);
    return { message: 'Password changed' };
  }
}
