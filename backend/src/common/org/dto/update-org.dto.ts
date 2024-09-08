import { PartialType } from '@nestjs/mapped-types';
import { OrgDto } from './create-org.dto';
import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateOrgDto extends PartialType(OrgDto) {
  @IsMongoId()
  orgId: Types.ObjectId;

  @IsString()
  @IsOptional()
  name: string;
}

export class UpdateOwnerDto {
  @IsMongoId()
  ownerId: Types.ObjectId;

  @IsMongoId()
  orgId: Types.ObjectId;
}
