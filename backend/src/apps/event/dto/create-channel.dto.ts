import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateChannelDto {
  @IsMongoId()
  orgId: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  name: string;
}
