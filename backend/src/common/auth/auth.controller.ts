import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { RefreshAccessTokenDto } from './dto/refresh-access-token.dto';
import { HandleExceptionResponse } from '../utils/custom-response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      return await this.authService.register(createUserDto);
    } catch (err) {
      return HandleExceptionResponse('Register failed', err);
    }
  }

  @Post('login')
  async login(@Req() req: Request, @Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(req, loginDto);
    } catch (err) {
      return HandleExceptionResponse('Login failed', err);
    }
  }

  @Post('refreshAccessToken')
  async refreshAccessToken(@Body() refreshTokenDto: RefreshAccessTokenDto) {
    try {
      return await this.authService.refreshAccessToken(
        refreshTokenDto.refreshToken,
      );
    } catch (err) {
      return HandleExceptionResponse('Access token refresh failed', err);
    }
  }

  @Get('logout')
  async logout(@Req() req: Request) {
    try {
      return await this.authService.logout(req);
    } catch (err) {
      return HandleExceptionResponse('Logout failed', err);
    }
  }
}
