import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrgUserRole, OrgUserStatus } from '../interfaces';
import { User } from 'src/common/user/schemas/user.schema';
import { Org } from './org.schema';

export type OrgUserDocument = OrgUser & Document;

@Schema()
export class OrgUser {
  @Prop({ type: Types.ObjectId, required: true, ref: User.name })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: Org.name })
  orgId: Types.ObjectId;

  @Prop({ default: OrgUserStatus.ACTIVE, enum: OrgUserStatus })
  status: OrgUserStatus;

  @Prop({ default: OrgUserRole.USER })
  role: OrgUserRole;
}

export const OrgUserSchema = SchemaFactory.createForClass(OrgUser);
