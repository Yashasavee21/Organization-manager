import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { OrgBillingPlan, OrgStatus } from '../interfaces';

export type OrgDocument = Org & Document;

@Schema()
export class Org {
  @Prop({ required: true })
  name: string;

  @Prop({ default: OrgBillingPlan.FREE, enum: OrgBillingPlan })
  billingPlan: string;

  @Prop({ default: OrgStatus.ACTIVE, enum: OrgStatus })
  status: OrgStatus;

  @Prop({ default: 'UTC' })
  timezone: string;
}

export const OrgSchema = SchemaFactory.createForClass(Org);
