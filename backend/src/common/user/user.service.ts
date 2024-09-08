import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ClientSession,
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  Types,
  UpdateQuery,
} from 'mongoose';
import { User, UserDocument, UserStatus } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ReqUser } from '../auth/interfaces';
import { FindUserDto } from './dto/find-user.dto';
import { APIConstants } from '../consts';
import CustomResponse, {
  HandleExceptionResponse,
} from '../utils/custom-response';
import { OrgUser } from '../org/schemas/org-user.schema';
import { Org } from '../org/schemas/org.schema';
import {
  SessionStatus,
  UserSession,
  UserSessionDocument,
} from '../auth/schemas/user-session.schema';
import { CustomJwtService } from '../utils/custom-jwt/custom-jwt.service';
import { parse as userAgentParse } from 'useragent';
import logger from '../logger';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(UserSession.name)
    private readonly userSessionModel: Model<UserSessionDocument>,
    public jwtService: CustomJwtService,
  ) {}

  async findActiveUser(findUserDto: FindUserDto) {
    try {
      const existingUser = await this.userModel.countDocuments(
        { email: findUserDto.email, status: UserStatus.ACTIVE },
        { _id: 1 },
      );

      if (existingUser) {
        return CustomResponse(
          'Valid User',
          APIConstants.Status.Success,
          APIConstants.StatusCode.Ok,
        );
      } else {
        throw Error('Invalid User');
      }
    } catch (err) {
      return HandleExceptionResponse(
        'Fetching user failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }

  async getCurrentUserContactInfo(reqUser: ReqUser) {}

  async getCurrentUser(reqUser: ReqUser) {
    try {
      const userId = reqUser.userId;

      const info = await this.userModel.aggregate([
        { $match: { status: UserStatus.ACTIVE, _id: userId } },
        {
          $lookup: {
            from: OrgUser.name,
            localField: '_id',
            foreignField: 'userId',
            as: 'orgusers',
          },
        },
        {
          $lookup: {
            from: Org.name,
            localField: 'orgusers.orgId',
            foreignField: '_id',
            as: 'orgs',
          },
        },
        {
          $project: {
            _id: 1,
            fname: 1,
            email: 1,
            org: {
              _id: { $arrayElemAt: ['$orgs._id', 0] },
              ownerId: { $arrayElemAt: ['$orgs.ownerId', 0] },
              billingPlan: { $arrayElemAt: ['$orgs.billingPlan', 0] },
              status: { $arrayElemAt: ['$orgs.status', 0] },
              timezone: { $arrayElemAt: ['$orgs.timezone', 0] },
            },
            orgUser: {
              _id: { $arrayElemAt: ['$orgusers._id', 0] },
              role: { $arrayElemAt: ['$orgusers.role', 0] },
              status: { $arrayElemAt: ['$orgusers.status', 0] },
            },
          },
        },
      ]);

      if (info.length === 0) {
        throw Error('Internal DB error');
      }

      return CustomResponse(
        'User info successfully fetched',
        APIConstants.Status.Success,
        APIConstants.StatusCode.Ok,
        info,
      );
    } catch (err) {
      return HandleExceptionResponse(
        'User info fetching failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }

  async createUser(createUserDto: CreateUserDto) {
    try {
      const existingUser = await this.userModel.countDocuments({
        email: createUserDto.email,
      });

      if (existingUser) {
        return CustomResponse(
          'User with this email already exists',
          APIConstants.Status.Warning,
          APIConstants.StatusCode.ExistingData,
        );
      }

      const hashedPass = await this.jwtService.createHashedText(
        createUserDto.password,
      );

      const createdUser = await new this.userModel({
        ...createUserDto,
        password: hashedPass,
      }).save();

      return CustomResponse(
        'User created successfully',
        APIConstants.Status.Success,
        APIConstants.StatusCode.Ok,
        { _id: createdUser._id, email: createdUser.email },
      );
    } catch (err) {
      return HandleExceptionResponse(
        'User creation failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }

  async updateUser(reqUser: ReqUser, updateUserDto: UpdateUserDto) {
    try {
      const newInfo = await this.userModel.findByIdAndUpdate(
        reqUser.userId,
        updateUserDto,
        { new: true, lean: true },
      );

      return CustomResponse(
        'Updated successfully',
        APIConstants.Status.Success,
        APIConstants.StatusCode.Ok,
        { ...newInfo },
      );
    } catch (err) {
      return HandleExceptionResponse(
        'User update failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }

  async disableUser(reqUser: ReqUser) {
    try {
      await this.userModel
        .findByIdAndUpdate(
          reqUser.userId,
          { status: UserStatus.INACTIVE },
          { new: true, lean: true },
        )
        .select('_id');

      return CustomResponse(
        'User disabled successfully',
        APIConstants.Status.Success,
        APIConstants.StatusCode.Ok,
      );
    } catch (err) {
      return HandleExceptionResponse(
        'User disable failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }

  // ==========================
  // utility functions
  // ==========================
  async getUserInfo(
    filter: FilterQuery<UserDocument>,
    projection?: ProjectionType<UserDocument>,
    options?: QueryOptions<UserDocument>,
  ) {
    try {
      return await this.userModel.findOne(filter, projection, options).lean();
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  async validUser(filter: FilterQuery<UserDocument>) {
    try {
      return await this.userModel.countDocuments(filter);
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  // start a session and return the session
  async getDBSession(): Promise<ClientSession> {
    try {
      return await this.userSessionModel.startSession();
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  async updateUserInfo(
    filter: FilterQuery<UserDocument>,
    updateDoc: UpdateQuery<UserDocument>,
    options: QueryOptions<UserDocument>,
  ) {
    try {
      return await this.userModel.findOneAndUpdate(filter, updateDoc, options);
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  async createUserSession(
    userId: Types.ObjectId,
    userIP: string,
    userAgent: string,
    session?: ClientSession,
  ) {
    try {
      const agent = userAgentParse(userAgent);
      const newSession = new this.userSessionModel({
        userId: userId,
        userIp: userIP,
        userBrowser: userAgent,
        userDevice: agent.device,
      });
      if (session) {
        return await newSession.save({ session: session });
      } else {
        return await newSession.save();
      }
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  async updateUserSession(
    filter: FilterQuery<UserSessionDocument>,
    updateDoc: UpdateQuery<UserSessionDocument>,
    options?: QueryOptions<UserSessionDocument>,
  ) {
    try {
      return await this.userSessionModel.findByIdAndUpdate(
        filter,
        updateDoc,
        options,
      );
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  async isValidUserSession(sessionId: Types.ObjectId) {
    try {
      return await this.userSessionModel.countDocuments({
        _id: sessionId,
        sessionStatus: SessionStatus.ACTIVE,
      });
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }
}
