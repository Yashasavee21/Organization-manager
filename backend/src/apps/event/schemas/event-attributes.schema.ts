import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EventUser } from './event-user.schema';
import { Org } from 'src/common/org/schemas/org.schema';

export type EventAttributesDocument = EventAttributes & Document;

@Schema({ timestamps: true })
export class EventAttributes {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Org.name })
  orgId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Event.name })
  eventId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: EventUser.name })
  eventUserId: Types.ObjectId;

  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  value: string;
}

export const EventAttributesSchema =
  SchemaFactory.createForClass(EventAttributes);
