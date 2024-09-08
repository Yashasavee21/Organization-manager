import { IsString, IsEmail } from 'class-validator';

export class FindUserDto {
  @IsString()
  @IsEmail()
  readonly email: string;
}
