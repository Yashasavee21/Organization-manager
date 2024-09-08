import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        if (!data?.statusCode) return data;

        const { statusCode } = data;

        let httpStatus: number;

        if (statusCode >= 100 && statusCode < 600) {
          httpStatus = statusCode;
        } else {
          httpStatus = 200;
        }

        response.status(httpStatus);
        return data;
      }),
    );
  }
}
