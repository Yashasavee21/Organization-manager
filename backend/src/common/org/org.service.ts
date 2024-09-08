import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import { Org } from './schemas/org.schema';
import { CreateOrgDto } from './dto/create-org.dto';
import { FindOrgDto } from './dto/find-org.dto';
import { OrgUser } from './schemas/org-user.schema';
import {
  InviteStatus,
  OrgStatus,
  OrgUserRole,
  OrgUserStatus,
} from './interfaces';
import logger from '../logger';
import { UpdateOrgDto, UpdateOwnerDto } from './dto/update-org.dto';
import { ReqUser } from '../auth/interfaces';
import { APIConstants, TokenType } from '../consts';
import CustomResponse, {
  HandleExceptionResponse,
} from '../utils/custom-response';
import { toObjectId } from '../utils';
import {
  InviteQueryDto,
  OrgUserInviteDto,
  ResendInviteDto,
} from './dto/invite-org.dto';
import { OrgUserInvite } from './schemas/org-user-invite.schema';
import { MailService } from '../services/vendors/mailjet/mailjet-service';
import { checkInviteToken } from '../utils/auth';
import { getSecret } from '../secrets';
import SecretKeys from '../secrets/keys';
import { UserService } from '../user/user.service';
import { CustomJwtService } from '../utils/custom-jwt/custom-jwt.service';

@Injectable()
export class OrgService {
  constructor(
    private mailjet: MailService,
    private readonly userService: UserService,
    @InjectModel(Org.name) private readonly orgModel: Model<Org>,
    @InjectModel(OrgUser.name) private readonly orgUserModel: Model<OrgUser>,
    @InjectModel(OrgUserInvite.name)
    private readonly orgUserInviteModel: Model<OrgUserInvite>,

    private readonly jwtService: CustomJwtService,
  ) {}

  async findOrg(findOrgDto: FindOrgDto) {
    try {
      const existingOrg = await this.orgModel.countDocuments({
        _id: findOrgDto.orgId,
      });

      if (existingOrg) {
        return CustomResponse(
          'Valid Org',
          APIConstants.Status.Success,
          APIConstants.StatusCode.Ok,
        );
      } else {
        throw Error('Invalid Org');
      }
    } catch (err) {
      return HandleExceptionResponse(
        'Fetching org failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }

  async createOrg(reqUser: ReqUser, createOrgDto: CreateOrgDto) {
    try {
      const ownerId = reqUser.userId;
      const user = await this.userService.validUser({ _id: ownerId });

      if (!user) {
        throw Error("User doesn't exist");
      }

      const newOrgData = {
        name: createOrgDto.name,
        timezone: createOrgDto.timezone,
      };

      const orgSession = await this.orgModel.db.startSession();
      orgSession.startTransaction();

      // If it thows IllegalOperation
      // Do this https://stackoverflow.com/a/71305937
      try {
        const createdOrg = await new this.orgModel(newOrgData).save({
          session: orgSession,
        });
        const createOrgUser = await new this.orgUserModel({
          userId: ownerId,
          orgId: createdOrg._id,
          status: OrgUserStatus.ACTIVE,
          role: OrgUserRole.OWNER,
        }).save({ session: orgSession });
        await orgSession.commitTransaction();

        return CustomResponse(
          'Organization created successfully',
          APIConstants.Status.Success,
          APIConstants.StatusCode.Ok,
          {
            org: { ...createdOrg.toObject() },
            orgUser: { ...createOrgUser.toObject() },
          },
        );
      } catch (err) {
        await orgSession.abortTransaction();
        throw err;
      } finally {
        await orgSession.endSession();
      }
    } catch (err) {
      return HandleExceptionResponse(
        'Org create failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }

  private async checkUserOrgPermission(
    userId: Types.ObjectId,
    orgId: Types.ObjectId,
    role: OrgUserRole,
  ) {
    return await this.orgUserModel.countDocuments({
      userId: userId,
      orgId: orgId.toString(),
      status: OrgUserStatus.ACTIVE,
      role: { $eq: role },
    });
  }

  async updateOrg(reqUser: ReqUser, updateOrgDto: UpdateOrgDto) {
    try {
      if (!updateOrgDto?.name) {
        return CustomResponse(
          'Nothing to update',
          APIConstants.Status.Warning,
          APIConstants.StatusCode.NoContent,
        );
      }

      const userId = reqUser.userId;
      const orgId = toObjectId(updateOrgDto.orgId);

      if (await this.checkUserOrgPermission(userId, orgId, OrgUserRole.OWNER)) {
        logger.warn('Non owner trying to update owner');
        throw Error('Not the owner');
      }

      const newOrgData = { name: updateOrgDto.name };

      await this.orgModel
        .findByIdAndUpdate(orgId, newOrgData, { lean: true })
        .select('_id');

      return CustomResponse(
        'Org successfully updated',
        APIConstants.Status.Success,
        APIConstants.StatusCode.Ok,
      );
    } catch (err) {
      return HandleExceptionResponse(
        'Org Update failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }

  async updateOwner(reqUser: ReqUser, updateOwnerDto: UpdateOwnerDto) {
    try {
      const userId = reqUser.userId;
      const orgId = toObjectId(updateOwnerDto.orgId);
      const newOwnerId = toObjectId(updateOwnerDto.ownerId);

      if (await this.checkUserOrgPermission(userId, orgId, OrgUserRole.OWNER)) {
        logger.warn('Non owner trying to update owner');
        throw Error('Not the owner');
      }

      //check if new ownerId is valid user
      if (!(await this.userService.validUser({ _id: newOwnerId }))) {
        throw Error('Invalid New Owner Id');
      }

      await this.orgUserModel.bulkWrite([
        {
          // update current owner role to user for current owner
          updateOne: {
            filter: { userId: userId, orgId: orgId },
            update: { role: OrgUserRole.USER },
          },
        },
        {
          // update current owner role to owner for new owner
          updateOne: {
            filter: { userId: newOwnerId, orgId: orgId },
            update: {
              $setOnInsert: {
                status: OrgUserStatus.ACTIVE,
                userId: newOwnerId,
                orgId: orgId,
              },
              $set: { role: OrgUserRole.OWNER },
            },
            upsert: true,
          },
        },
      ]);

      return CustomResponse(
        'Org owner updated!',
        APIConstants.Status.Success,
        APIConstants.StatusCode.Ok,
      );
    } catch (err) {
      return HandleExceptionResponse(
        'Org owner update failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }

  private async createInviteUrl(
    inviteId: string,
    baseUrl: string,
    email: string,
  ): Promise<string> {
    const inviteToken = await this.jwtService.createToken(
      { inviteId: inviteId, tokenType: TokenType.ONETIME },
      TokenType.ONETIME,
    );
    const inviteUrl = `${baseUrl}/org/acceptInvite?email=${email}&token=${inviteToken}`;
    return inviteUrl;
  }

  private async sendInviteMail(email: string, inviteUrl: string) {
    return await this.mailjet.sendEmail({
      toEmail: email,
      toName: '',
      inviteurl: inviteUrl,
    });
  }

  async sendInvite(
    reqUser: ReqUser,
    orgUserInviteDto: OrgUserInviteDto | ResendInviteDto,
    resend?: boolean,
  ) {
    const msgString = `${resend ? 're' : ''}send`;
    try {
      const userId = reqUser.userId;
      let orgId: Types.ObjectId, email: string, inviteId: Types.ObjectId;
      if (resend && 'inviteId' in orgUserInviteDto) {
        inviteId = orgUserInviteDto.inviteId;
      } else if ('orgId' in orgUserInviteDto && 'email' in orgUserInviteDto) {
        orgId = toObjectId(orgUserInviteDto.orgId);
        email = orgUserInviteDto.email;
      }

      if (await this.checkUserOrgPermission(userId, orgId, OrgUserRole.OWNER)) {
        logger.warn(`Non owner trying to ${msgString} invite`);
        throw Error('Not the owner');
      }

      if (resend) {
        const existingInvite = await this.orgUserInviteModel
          .findOne(
            { _id: inviteId, status: InviteStatus.INVITED },
            { orgId: 1, email: 1, _id: 0 },
          )
          .lean();

        if (!existingInvite) {
          throw Error('Invalid Invite Id');
        }

        email = existingInvite.email;
      }

      // check if the given email used is already part of the Organization
      const id = (
        await this.userService.getUserInfo({ email: email }, { _id: 1 })
      )?._id;

      let orgUserExists: number;
      if (id) {
        orgUserExists = await this.orgUserModel.countDocuments({
          userId: id,
          orgId: orgId,
        });
      }
      if (orgUserExists) {
        return CustomResponse(
          `Cannot ${msgString} invitation, already part of Org`,
          APIConstants.Status.Warning,
          APIConstants.StatusCode.ExistingData,
        );
      }

      if (!resend) {
        const existingInvite = await this.orgUserInviteModel
          .findOne({
            email: email,
            status: InviteStatus.INVITED,
            expireAt: { $lt: new Date() },
          })
          .lean();

        let invite: Document<unknown, {}, OrgUserInvite> &
          OrgUserInvite & { _id: Types.ObjectId };
        if (existingInvite) {
          return CustomResponse(
            'Already sent an invitation, check email.',
            APIConstants.Status.Warning,
            APIConstants.StatusCode.ExistingData,
          );
        }

        if (!invite) {
          invite = await new this.orgUserInviteModel({
            orgId: orgId,
            email: email,
          }).save();
          inviteId = invite._id;
        }
      }

      const inviteUrl = await this.createInviteUrl(
        inviteId.toString(),
        getSecret(SecretKeys.BASE_URL),
        email,
      );

      const mail = await this.sendInviteMail(email, inviteUrl);
      if (mail) {
        return CustomResponse(
          `Invite ${msgString} successfully!`,
          APIConstants.Status.Success,
          APIConstants.StatusCode.Ok,
        );
      } else {
        throw Error(`Failed to ${msgString} the invite mail`);
      }
    } catch (err) {
      return HandleExceptionResponse(
        `${msgString.toUpperCase()} Invite failed`,
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }

  async acceptInvite(inviteQueryDto: InviteQueryDto) {
    try {
      const { email, token } = inviteQueryDto;

      const payload = await checkInviteToken(this.jwtService, token);
      const inviteId = payload.inviteId;

      const currentUserInvite = await this.orgUserInviteModel.findOne({
        _id: inviteId,
        expireAt: { $lt: new Date() },
      });

      if (
        !currentUserInvite ||
        currentUserInvite.status === InviteStatus.EXPIRED
      ) {
        throw Error('User Invite expired');
      } else if (currentUserInvite.status === InviteStatus.ACCEPTED) {
        return CustomResponse(
          'User Invite already accepted',
          APIConstants.Status.Warning,
          APIConstants.StatusCode.Ok,
        );
      }

      // If it thows IllegalOperation
      // Do this https://stackoverflow.com/a/71305937
      const session = await this.orgUserInviteModel.db.startSession();
      session.startTransaction();

      try {
        await this.orgUserInviteModel
          .findOneAndUpdate(
            { _id: inviteId, status: InviteStatus.INVITED },
            { status: InviteStatus.ACCEPTED },
          )
          .session(session);

        const user = await this.userService.updateUserInfo(
          { email: email },
          { email: email, inviteId: inviteId },
          { session: session, upsert: true, new: true },
        );

        await new this.orgUserModel({
          userId: user._id,
          orgId: currentUserInvite.orgId,
        }).save({ session: session });

        await session.commitTransaction();

        return CustomResponse(
          'User Invite Accepted',
          APIConstants.Status.Success,
          APIConstants.StatusCode.Ok,
          { userId: user._id },
        );
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        await session.endSession();
      }
    } catch (err) {
      return HandleExceptionResponse(
        'Accept Invite failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }

  // ==========================
  // utility functions
  // ==========================
  async findOrgUser(
    userId: Types.ObjectId,
    orgId: Types.ObjectId,
    status: OrgUserStatus = OrgUserStatus.ACTIVE,
    role?: OrgUserRole,
  ) {
    const findDoc = {
      userId: userId,
      orgId: orgId,
      status: status,
    };
    if (role) {
      findDoc['role'] = role;
    }

    try {
      return await this.orgUserModel.findOne(findDoc, { role: 1 }).lean();
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }
}
