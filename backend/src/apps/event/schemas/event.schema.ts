import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EventUser } from './event-user.schema';
import { EventChannel } from './event-channel.schema';

export type EventDocument = Event & Document;

@Schema()
export class Event {
  @Prop()
  eventName: string;

  @Prop({ type: Types.ObjectId, ref: EventUser.name })
  eventUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: EventChannel.name })
  channelId: Types.ObjectId;

  @Prop()
  userIp: string;

  @Prop()
  userAgent: string;

  @Prop()
  userBrowser: string;

  @Prop()
  userDevice: string;

  @Prop()
  userOS: string;

  @Prop()
  value: number;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
