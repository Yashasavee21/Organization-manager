import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
} from 'class-validator';
import { Types } from 'mongoose';

export class UserDto {
  @IsOptional()
  @IsString()
  fname: string;

  @IsOptional()
  @IsString()
  lname: string;
}

export class CreateUserDto extends UserDto {
  @IsString()
  @IsEmail()
  email: string;

  @MinLength(6, {
    message: 'password too short',
  })
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  inviteId: Types.ObjectId;
}
