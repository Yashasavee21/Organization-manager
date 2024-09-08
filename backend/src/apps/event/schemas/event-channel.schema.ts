import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Org } from 'src/common/org/schemas/org.schema';
import { User } from 'src/common/user/schemas/user.schema';

export type EventChannelDocument = EventChannel & Document;

@Schema()
export class EventChannel {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Org.name })
  orgId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  userId: Types.ObjectId;

  @Prop({})
  name: string;
}

export const EventChannelSchema = SchemaFactory.createForClass(EventChannel);
