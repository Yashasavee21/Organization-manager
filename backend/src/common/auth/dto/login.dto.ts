import {
  IsEmail,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';

export class LoginDto {
  @IsEmail()
  email: string;

  @MinLength(6, {
    message: 'password too short',
  })
  password: string;

  @IsMongoId()
  @IsOptional()
  @IsString()
  inviteId: Types.ObjectId;
}
