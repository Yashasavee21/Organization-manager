import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { isMongoId } from 'class-validator';
import logger from 'src/common/logger';

@Injectable()
export class EventGaurd implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const req = context.switchToHttp().getRequest();
      const apikey = req.headers?.apikey;

      if (!apikey) {
        throw new Error('API Key not passed with headers');
      }

      if (!isMongoId(apikey)) {
        throw new Error('API Key is not valid, [invalid mongo id]');
      }

      const obj = { apikey: apikey };

      if (isMongoId(req.cookies?.eventuserid)) {
        obj['eventUserId'] = req.cookies?.eventuserid;
      }

      req['event'] = obj;

      return true;
    } catch (err) {
      logger.error(err);
      return false;
    }
  }
}
