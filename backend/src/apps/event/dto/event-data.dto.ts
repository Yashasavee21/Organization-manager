import { Transform } from 'class-transformer';
import {
  IsIP,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class EventDataDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  eventName: string;

  @IsIP()
  @IsNotEmpty()
  userIp: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsNumber()
  @IsOptional()
  value: number;

  @IsObject()
  @IsOptional()
  attributes: Object;
}
