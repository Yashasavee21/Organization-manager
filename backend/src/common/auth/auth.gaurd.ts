import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { toObjectId } from '../utils';
import logger from '../logger';
import { Reflector } from '@nestjs/core';
import { checkAccessToken } from '../utils/auth';
import { isMongoId } from 'class-validator';
import { OrgUserStatus } from '../org/interfaces';
import { OrgService } from '../org/org.service';
import { ChannelTypes, IS_PUBLIC_KEY, SKIP_ORG_AUTH } from '../consts';
import { CustomJwtService } from '../utils/custom-jwt/custom-jwt.service';

@Injectable()
export class AuthGaurd implements CanActivate {
  constructor(
    private jwtService: CustomJwtService,
    private reflector: Reflector,
    private orgService: OrgService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const isPublic = this.reflector.getAllAndOverride<boolean>(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()],
      );

      const skipOrgAuth = this.reflector.getAllAndOverride<boolean>(
        SKIP_ORG_AUTH,
        [context.getHandler(), context.getClass()],
      );

      if (isPublic) return true;

      const req = context.switchToHttp().getRequest();
      const token = req.cookies?.access_token || req.headers?.access_token;
      const channel = req.headers?.channel;
      let orgId = req.headers?.org_id;

      if (!token) {
        throw Error('Access Token not passed with headers');
      }

      if (!channel || !ChannelTypes[channel]) {
        throw Error('channel not passed with headers');
      }

      const payload = await checkAccessToken(this.jwtService, token);
      payload.userId = toObjectId(payload.userId);
      payload.sessionId = toObjectId(payload.sessionId);

      if (skipOrgAuth) {
        req['user'] = payload;
        return true;
      }

      if (!orgId) {
        throw Error('orgId not passed with headers');
      } else if (!isMongoId(orgId)) {
        throw Error('Invalid orgId passed with headers');
      }

      orgId = toObjectId(orgId);

      const orgUser = await this.orgService.findOrgUser(payload.userId, orgId);

      if (!orgUser) {
        throw Error('Invalid orgId or userId is not part of orgId');
      }

      req['org'] = { orgId: orgId, role: orgUser.role };
      req['user'] = payload;

      return true;
    } catch (err) {
      logger.error(err);
      return false;
    }
  }
}
