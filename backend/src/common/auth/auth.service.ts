import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { UserStatus } from '../user/schemas/user.schema';
import { SessionStatus } from './schemas/user-session.schema';

import logger from '../logger';
import { APIConstants, TokenType } from '../consts';
import CustomResponse, {
  HandleExceptionResponse,
} from '../utils/custom-response';
import { checkAccessToken, checkRefreshToken } from '../utils/auth';
import { CustomJwtService } from '../utils/custom-jwt/custom-jwt.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: CustomJwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    return await this.userService.createUser(createUserDto);
  }

  async login(req: Request, loginDto: LoginDto) {
    try {
      const existingUser = await this.userService.getUserInfo(
        { email: loginDto.email },
        { password: 1 },
      );

      if (
        !existingUser ||
        !(await this.jwtService.comparingPlainTextTohashed(
          loginDto.password,
          existingUser.password,
        ))
      ) {
        throw Error('Invalid email or password');
      }

      const session = await this.userService.getDBSession();
      session.startTransaction();

      try {
        const userSession = await this.userService.createUserSession(
          existingUser._id,
          req.ip,
          req.headers['user-agent'],
          session,
        );

        await this.userService.updateUserInfo(
          { _id: existingUser._id },
          {
            lastActiveSessionId: userSession._id,
            $currentDate: { lastActiveAt: { $type: 'date' } },
          },
          { session: session, lean: true },
        );

        await session.commitTransaction();
        await session.endSession();

        const jwtAccessToken = await this.jwtService.createToken(
          {
            userId: existingUser._id,
            sessionId: userSession._id,
            tokenType: TokenType.ACCESS,
          },
          TokenType.ACCESS,
        );

        const jwtRefreshToken = await this.jwtService.createToken(
          {
            userId: existingUser._id,
            sessionId: userSession._id,
            tokenType: TokenType.REFRESH,
          },
          TokenType.REFRESH,
        );

        return CustomResponse(
          'User Logged In Successfully',
          APIConstants.Status.Success,
          APIConstants.StatusCode.Ok,
          { accessToken: jwtAccessToken, refreshToken: jwtRefreshToken },
        );
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        await session.endSession();
      }
    } catch (err) {
      return HandleExceptionResponse(
        'User login failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }

  async refreshAccessToken(token: string) {
    try {
      const payload = await checkRefreshToken(this.jwtService, token);

      const validUser = await this.userService.validUser({
        _id: payload.userId,
        status: UserStatus.ACTIVE,
      });

      if (!validUser) {
        logger.warn('Invalid userId passed with Refresh token');
        throw Error('Invalid Refresh token');
      }

      const validSession = await this.userService.isValidUserSession(
        payload.sessionId,
      );

      if (!validSession) {
        logger.warn({
          msg: 'User session is no longer active',
          data: { userId: payload.userId },
        });
        throw Error('Invalid Refresh token');
      }

      const jwtAccessToken = await this.jwtService.createToken(
        {
          userId: payload.userId,
          sessionId: payload.sessionId,
          tokenType: TokenType.ACCESS,
        },
        TokenType.ACCESS,
      );

      return CustomResponse(
        'Access Token Generated Successfully',
        APIConstants.Status.Success,
        APIConstants.StatusCode.Ok,
        { accessToken: jwtAccessToken },
      );
    } catch (err) {
      return HandleExceptionResponse(
        'Access token refresh failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }

  async logout(req: Request) {
    try {
      const token = req.cookies?.access_token || req.headers?.access_token;

      const payload = await checkAccessToken(this.jwtService, token);

      const validSession = await this.userService.isValidUserSession(
        payload.sessionId,
      );

      if (!validSession) {
        logger.warn('Invalid userId passed with Access token');
        throw Error('Invalid Access token');
      }

      await this.userService.updateUserSession(
        { _id: payload.sessionId },
        { sessionStatus: SessionStatus.INACTIVE },
      );

      return CustomResponse(
        'User logged out Successfully',
        APIConstants.Status.Success,
        APIConstants.StatusCode.Ok,
      );
    } catch (err) {
      return HandleExceptionResponse(
        'User logout failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }
}
