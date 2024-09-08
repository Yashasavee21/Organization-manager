import { Module, forwardRef } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { OrgUser, OrgUserSchema } from 'src/common/org/schemas/org-user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EventChannel,
  EventChannelSchema,
} from './schemas/event-channel.schema';
import { EventUser, EventUserSchema } from './schemas/event-user.schema';
import { EventSchema } from './schemas/event.schema';
import {
  EventAttributes,
  EventAttributesSchema,
} from './schemas/event-attributes.schema';
import { EventApiKey, EventApiKeySchema } from './schemas/event-apikey.schema';
import {
  EventUserInfo,
  EventUserInfoSchema,
} from './schemas/event-user-info.schema';
import { CustomJwtModule } from 'src/common/utils/custom-jwt/custom-jwt.module';
import { OrgModule } from 'src/common/org/org.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventChannel.name, schema: EventChannelSchema },
      { name: EventApiKey.name, schema: EventApiKeySchema },

      { name: EventUser.name, schema: EventUserSchema },
      { name: EventUserInfo.name, schema: EventUserInfoSchema },

      { name: Event.name, schema: EventSchema },
      { name: EventAttributes.name, schema: EventAttributesSchema },
    ]),
    forwardRef(() => OrgModule),
    CustomJwtModule,
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
