import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class OrgDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class CreateOrgDto extends OrgDto {
  @IsOptional()
  @IsString()
  timezone: string;
}
