import { IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class ResetKeyDto {
  @IsMongoId()
  channelId: Types.ObjectId;
}
