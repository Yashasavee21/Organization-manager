import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MSchema } from 'mongoose';
import { EventUser } from './event-user.schema';

export type EventUserInfoDocument = EventUserInfo & Document;

export enum EventUserInfoType {
  PHONE = 'phone',
  EMAIL = 'email',
}

@Schema()
export class EventUserInfo {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: EventUser.name })
  eventUserId: Types.ObjectId;

  @Prop({ enum: EventUserInfoType })
  type: EventUserInfoType;

  @Prop({ required: true, type: MSchema.Types.Mixed })
  value: number | string;
}

export const EventUserInfoSchema = SchemaFactory.createForClass(EventUserInfo);
