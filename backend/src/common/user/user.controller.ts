import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGaurd } from '../auth/auth.gaurd';
import { CustomExpressRequest } from '../auth/interfaces';
import { FindUserDto } from './dto/find-user.dto';
import { Public, SkipOrgAuth } from '../utils/auth';
import { HandleExceptionResponse } from '../utils/custom-response';

@Controller('user')
@UseGuards(AuthGaurd)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @SkipOrgAuth()
  @Post('findUser')
  async findUser(@Body() findUserDto: FindUserDto) {
    try {
      return await this.userService.findActiveUser(findUserDto);
    } catch (err) {
      return HandleExceptionResponse('FindUser failed', err);
    }
  }

  @SkipOrgAuth()
  @Get('me')
  async getCurrentUser(@Request() req: CustomExpressRequest) {
    try {
      return await this.userService.getCurrentUser(req.user);
    } catch (err) {
      return HandleExceptionResponse('User info fetching failed', err);
    }
  }

  @SkipOrgAuth()
  @Patch('updateUser')
  async updateUser(
    @Request() req: CustomExpressRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      return await this.userService.updateUser(req.user, updateUserDto);
    } catch (err) {
      return HandleExceptionResponse('Update user failed', err);
    }
  }

  @SkipOrgAuth()
  @Delete('disable')
  async disableUser(@Request() req: CustomExpressRequest) {
    try {
      return await this.userService.disableUser(req.user);
    } catch (err) {
      return HandleExceptionResponse('Disable user failed', err);
    }
  }
}
