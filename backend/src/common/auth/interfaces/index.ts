import { Types } from 'mongoose';
import { OrgUserRole } from 'src/common/org/interfaces';

export type ReqUser = {
  userId: Types.ObjectId;
  tokenType: string;
  sessionId: Types.ObjectId;
};

export type ReqOrg = {
  orgId: Types.ObjectId;
  role: OrgUserRole;
};

export type ReqEvent = { apikey: Types.ObjectId; eventUserId: Types.ObjectId };

export interface CustomExpressRequest extends Request {
  user: ReqUser;
  org: ReqOrg;
  event: ReqEvent;
}
