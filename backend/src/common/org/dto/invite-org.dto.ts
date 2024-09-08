import { IsBoolean, IsEmail, IsJWT, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class OrgUserInviteDto {
  @IsMongoId()
  orgId: Types.ObjectId;

  @IsEmail()
  email: string;
}

export class ResendInviteDto {
  @IsMongoId()
  inviteId: Types.ObjectId;
}

export class ResendInviteQuery {
  @IsBoolean()
  resend: boolean;
}

export class InviteQueryDto {
  @IsEmail()
  email: string;

  @IsJWT()
  token: string;
}
