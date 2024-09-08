import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserSession } from 'src/common/auth/schemas/user-session.schema';
import { OrgUserInvite } from 'src/common/org/schemas/org-user-invite.schema';

export type UserDocument = User & Document;

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Schema()
export class User {
  @Prop()
  fname: string;

  @Prop()
  lname: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, minlength: 6, select: 0 })
  password: string;

  @Prop({ required: true, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop({ type: Types.ObjectId, ref: OrgUserInvite.name })
  inviteId: Types.ObjectId;

  @Prop({ default: Date.now })
  lastActiveAt: Date;

  @Prop({ ref: UserSession.name, type: Types.ObjectId })
  lastActiveSessionId: UserSession;
}

export const UserSchema = SchemaFactory.createForClass(User);
