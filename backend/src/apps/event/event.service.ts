import { Injectable } from '@nestjs/common';
import { EventDataDto } from './dto/event-data.dto';
import logger from 'src/common/logger';
import CustomResponse, {
  HandleExceptionResponse,
} from 'src/common/utils/custom-response';
import { APIConstants } from 'src/common/consts';
import { CreateChannelDto } from './dto/create-channel.dto';
import { IdentifyUserDto } from './dto/identify-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import { EventChannel } from './schemas/event-channel.schema';
import { EventUser, EventUsersType } from './schemas/event-user.schema';
import { EventAttributes } from './schemas/event-attributes.schema';
import { Event } from './schemas/event.schema';
import {
  CustomExpressRequest,
  ReqEvent,
  ReqUser,
} from 'src/common/auth/interfaces';
import { ResetKeyDto } from './dto/reset-key.dto';
import { EventApiKey } from './schemas/event-apikey.schema';
import { ApiKeyStatus } from './interfaces';
import { toObjectId } from 'src/common/utils';
import {
  EventUserInfo,
  EventUserInfoType,
} from './schemas/event-user-info.schema';
import { OrgUserRole, OrgUserStatus } from 'src/common/org/interfaces';
import { parse as userAgentParse } from 'useragent';
import { OrgService } from 'src/common/org/org.service';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name)
    readonly eventModel: Model<Event>,
    @InjectModel(EventChannel.name)
    readonly eventChannelModel: Model<EventChannel>,
    @InjectModel(EventApiKey.name)
    readonly eventApiKeyModel: Model<EventApiKey>,
    @InjectModel(EventUser.name)
    readonly eventUserModel: Model<EventUser>,
    @InjectModel(EventUserInfo.name)
    readonly eventUserInfoModel: Model<EventUserInfo>,
    @InjectModel(EventAttributes.name)
    readonly eventAttributesModel: Model<EventAttributes>,

    private readonly orgService: OrgService,
  ) {}

  private async validateApiKey(key: Types.ObjectId) {
    try {
      const apikey = await this.eventApiKeyModel
        .findOne({ _id: key, status: ApiKeyStatus.ACTIVE })
        .populate<{ channelId: EventChannel }>('channelId', { orgId: 1 })
        .lean();

      if (!apikey) {
        throw Error('Invalid API Key');
      } else if (!apikey.channelId) {
        logger.error(
          "API Key is valid but the corresponding channelId document doesn't exists in db",
        );
        throw Error('Invalid API Key');
      }

      return apikey;
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  async createChannel(
    req: CustomExpressRequest,
    createChannelDto: CreateChannelDto,
  ) {
    try {
      const userId = req.user.userId;
      let { orgId, name } = createChannelDto;
      orgId = toObjectId(orgId);

      const orgUser = await this.orgService.findOrgUser(orgId, userId);

      if (!orgUser) {
        throw new Error('Invalid orgId or userId');
      }

      const session = await this.eventChannelModel.db.startSession();
      session.startTransaction();
      try {
        // If it thows IllegalOperation
        // Do this https://stackoverflow.com/a/71305937
        const channel = await new this.eventChannelModel({
          orgId: orgId,
          userId: userId,
          name: name,
        }).save({ session: session });

        await new this.eventApiKeyModel({
          channelId: channel._id,
        }).save({ session: session });

        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        await session.endSession();
      }

      return CustomResponse(
        'Channel created',
        APIConstants.Status.Success,
        APIConstants.StatusCode.Ok,
      );
    } catch (err) {
      return HandleExceptionResponse(
        'Create channel failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }

  async getChannelByApiKey(userObj: ReqUser, eventObj: ReqEvent) {
    try {
      const apikey = await this.validateApiKey(eventObj.apikey);

      const userId = userObj.userId;
      const channel = await this.eventChannelModel.findOne(
        { userId: userId, _id: apikey.channelId._id },
        { name: 1 },
        { lean: true },
      );

      if (!channel) {
        logger.error(
          "API Key was valid, but couldn't find corresponding channel",
        );
        throw new Error('Invalid API key');
      }

      return CustomResponse(
        'Get channel successfull',
        APIConstants.Status.Success,
        APIConstants.StatusCode.Ok,
        { channelId: channel._id, name: channel.name },
      );
    } catch (err) {
      return HandleExceptionResponse(
        'Get channel failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }

  async resetApiKey(userObj: ReqUser, resetKeyDto: ResetKeyDto) {
    try {
      const userId = userObj.userId;
      const channel = await this.eventChannelModel.findOne(
        { _id: resetKeyDto.channelId, userId: userId },
        { orgId: 1 },
      );

      if (!channel) {
        throw new Error('Invalid channelId or user');
      }

      if (
        !(await this.orgService.findOrgUser(
          userId,
          channel.orgId,
          OrgUserStatus.ACTIVE,
          OrgUserRole.OWNER,
        ))
      ) {
        logger.warn(`Non owner trying to reset api key`);
        throw new Error('Not the owner');
      }

      const session = await this.eventApiKeyModel.db.startSession();
      session.startTransaction();

      let newkey: Document<unknown, {}, EventApiKey> &
        EventApiKey & { _id: Types.ObjectId };

      try {
        await this.eventApiKeyModel.findOneAndUpdate(
          { channelId: resetKeyDto.channelId, status: ApiKeyStatus.ACTIVE },
          { status: ApiKeyStatus.EXPIRED },
        );

        newkey = await new this.eventApiKeyModel({
          channelId: resetKeyDto.channelId,
        }).save({ session: session });

        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        await session.endSession();
      }

      return CustomResponse(
        'API key regenerated',
        APIConstants.Status.Success,
        APIConstants.StatusCode.Ok,
        { apikey: newkey._id },
      );
    } catch (err) {
      return HandleExceptionResponse(
        'Reset api key failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }

  async receiveEvent(
    eventDataDto: EventDataDto,
    eventObj: ReqEvent,
    userAgent: string,
  ) {
    try {
      const apikey = await this.validateApiKey(eventObj.apikey);

      let eventUserId = eventObj?.eventUserId;
      if (eventUserId) eventUserId = toObjectId(eventUserId);

      const eventName = eventDataDto.eventName;
      const channelId = apikey.channelId._id;
      const userIp = eventDataDto.userIp;
      const value = eventDataDto?.value;
      const attributes = eventDataDto?.attributes;

      const agent = userAgentParse(userAgent);

      const session = await this.eventUserModel.db.startSession();
      session.startTransaction();

      try {
        let createEventUserId = false;
        if (!eventUserId) {
          createEventUserId = true;
        } else {
          if (
            !(await this.eventUserModel.countDocuments({ _id: eventUserId }))
          ) {
            logger.warn('Invalid event user id received');
            createEventUserId = true;
          }

          if (createEventUserId) {
            let eventUser = await new this.eventUserModel({
              type: EventUsersType.TEMPORARY,
            }).save({ session: session });
            eventUserId = eventUser._id;
          }
        }

        const event = await new this.eventModel({
          eventName: eventName,
          eventUserId: eventUserId,
          channelId: channelId,
          userIp: userIp,
          userAgent: userAgent,
          userBrowser: agent.toAgent(),
          userOS: agent.os.toString(),
          userDevice: agent.device.toString(),
          value: value,
        }).save({ session: session });

        const parsedAttributes = [];
        for (const key in attributes) {
          if (Object.hasOwnProperty.call(attributes, key)) {
            const value = attributes[key];
            if (typeof value === 'string') {
              parsedAttributes.push({
                orgId: apikey.channelId.orgId,
                eventUserId: event.eventUserId,
                eventId: event._id,
                key: key,
                value: value,
              });
            }
          }
        }

        await this.eventAttributesModel.insertMany(parsedAttributes, {
          session: session,
          lean: true,
        });

        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        await session.endSession();
      }

      return CustomResponse(
        'Event Received',
        APIConstants.Status.Success,
        APIConstants.StatusCode.Ok,
        { eventUserId: eventUserId },
      );
    } catch (err) {
      return HandleExceptionResponse(
        'Event receive failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }

  async identifyUser(
    req: CustomExpressRequest,
    identifyUserDto: IdentifyUserDto,
  ) {
    try {
      const eventObj = req.event;
      let eventUserId = eventObj?.eventUserId;

      const apikey = await this.validateApiKey(eventObj.apikey);

      const email = identifyUserDto?.email;
      const phone = identifyUserDto?.phone;
      const clientUID = identifyUserDto?.clientUID;

      if (!email && !phone && !clientUID) {
        throw new Error('Missing email / phone / clientUID');
      }

      let data = {};
      if (email) {
        data['email'] = email;
      }
      if (phone) {
        data['phone'] = phone;
      }
      if (clientUID) {
        data['clientUID'] = clientUID;
      }

      const newData = {
        type: EventUsersType.PERMANENT,
        channelId: apikey.channelId._id,
        orgId: apikey.channelId.orgId,
        ...data,
      };

      // event userid stuff
      if (!eventUserId) {
        let eventUser = await new this.eventUserModel(newData).save();
        eventUserId = eventUser._id;
      } else {
        let eventUser = await this.eventUserModel.findById(eventUserId).lean();
        if (!eventUser) {
          // create PERMANENT id
          eventUser = await new this.eventUserModel(newData).save();
          eventUserId = eventUser._id;
        } else {
          const session = await this.eventUserModel.db.startSession();
          session.startTransaction();
          try {
            if (
              eventUser?.clientUID &&
              data?.['clientUID'] &&
              eventUser?.clientUID !== data?.['clientUID']
            ) {
              eventUser = await new this.eventUserModel(newData).save({
                session: session,
              });
              eventUserId = eventUser._id;
            } else {
              let updateData = { type: EventUsersType.PERMANENT, ...data };
              let newEmailOrPhone = [];

              if (
                eventUser?.email &&
                data?.['email'] &&
                eventUser.email !== data['email']
              ) {
                updateData['email'] = data['email'];
                newEmailOrPhone.push({
                  eventUserId: eventUser._id,
                  type: EventUserInfoType.EMAIL,
                  value: eventUser.email,
                });
              }

              if (
                eventUser?.phone &&
                data?.['phone'] &&
                eventUser.phone !== data['phone']
              ) {
                updateData['phone'] = data['phone'];
                newEmailOrPhone.push({
                  eventUserId: eventUser._id,
                  type: EventUserInfoType.PHONE,
                  value: eventUser.phone,
                });
              }

              if (newEmailOrPhone.length !== 0) {
                await this.eventUserInfoModel.insertMany(newEmailOrPhone, {
                  session: session,
                });
              }
              await this.eventUserModel.updateOne(
                { _id: eventUserId },
                updateData,
                { session: session },
              );
            }
            await session.commitTransaction();
          } catch (err) {
            await session.abortTransaction();
            throw err;
          } finally {
            await session.endSession();
          }
        }
      }

      return CustomResponse(
        'User identified successfully',
        APIConstants.Status.Success,
        APIConstants.StatusCode.Ok,
        { eventUserId: eventUserId },
      );
    } catch (err) {
      return HandleExceptionResponse(
        'Identify User failed',
        err,
        APIConstants.StatusCode.BadRequest,
      );
    }
  }
}
