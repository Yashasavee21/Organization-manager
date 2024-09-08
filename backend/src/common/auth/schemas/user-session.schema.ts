import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserSessionDocument = UserSession & Document;

export enum SessionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

@Schema()
export class UserSession {
  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: SessionStatus, default: SessionStatus.ACTIVE })
  sessionStatus: SessionStatus;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ required: true })
  userIp: string;

  @Prop({ required: false })
  userBrowser: string;

  @Prop({ required: false })
  userDevice: string;

  @Prop({ required: false })
  userApplicationVersion: string;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);
