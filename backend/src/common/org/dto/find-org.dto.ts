import { IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class FindOrgDto {
  @IsMongoId()
  orgId: Types.ObjectId;
}
