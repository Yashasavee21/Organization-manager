import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Org } from 'src/common/org/schemas/org.schema';
import { EventChannel } from './event-channel.schema';

export type EventUserDocument = EventUser & Document;

export enum EventUsersType {
  PERMANENT = 'permanent',
  TEMPORARY = 'temporary',
}

@Schema()
export class EventUser {
  _id: Types.ObjectId;

  @Prop({ enum: EventUsersType, default: EventUsersType.TEMPORARY })
  type: EventUsersType;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop()
  clientUID: string;

  @Prop({ ref: EventChannel.name })
  channelId: Types.ObjectId;

  @Prop({ ref: Org.name })
  orgId: Types.ObjectId;
}

export const EventUserSchema = SchemaFactory.createForClass(EventUser);
