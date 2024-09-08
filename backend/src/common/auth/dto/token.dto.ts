import { IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { TokenType } from 'src/common/consts';

export class TokenDto {
  @IsMongoId()
  userId: Types.ObjectId;

  @IsMongoId()
  sessionId: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @IsEnum(TokenType)
  tokenType: TokenType;
}

export type InviteTokenDto = {
  tokenType: TokenType;
  inviteId: any;
};
