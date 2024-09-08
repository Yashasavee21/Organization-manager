import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ApiKeyStatus } from '../interfaces';
import { EventChannel } from './event-channel.schema';

export type EventApiKeyDocument = EventApiKey & Document;

@Schema()
export class EventApiKey {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: EventChannel.name })
  channelId: Types.ObjectId;

  @Prop({ enum: ApiKeyStatus, default: ApiKeyStatus.ACTIVE, required: true })
  status: ApiKeyStatus;
}

export const EventApiKeySchema = SchemaFactory.createForClass(EventApiKey);
