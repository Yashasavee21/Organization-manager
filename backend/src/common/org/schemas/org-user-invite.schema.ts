import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { InviteStatus } from '../interfaces';
import Opts from 'src/common/options';
import { Org } from './org.schema';

export type OrgUserInviteDocument = OrgUserInvite & Document;

@Schema()
export class OrgUserInvite {
  @Prop({ type: Types.ObjectId, required: true, ref: Org.name })
  orgId: Types.ObjectId;

  @Prop({ required: true })
  email: string;

  @Prop({ default: InviteStatus.INVITED, required: true })
  status: InviteStatus;

  @Prop({
    default: () => {
      return new Date(Date.now() + Opts.INVITE_TOKEN_EXPIRY_SCHEMA);
    },
    type: Date,
  })
  expireAt: Date;
}

export const OrgUserInviteSchema = SchemaFactory.createForClass(OrgUserInvite);
