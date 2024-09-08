import { Module, forwardRef } from '@nestjs/common';
import { OrgService } from './org.service';
import { OrgController } from './org.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Org, OrgSchema } from './schemas/org.schema';
import { OrgUser, OrgUserSchema } from './schemas/org-user.schema';
import {
  OrgUserInvite,
  OrgUserInviteSchema,
} from './schemas/org-user-invite.schema';
import { MailService } from '../services/vendors/mailjet/mailjet-service';
import { UserModule } from '../user/user.module';
import { CustomJwtModule } from '../utils/custom-jwt/custom-jwt.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Org.name, schema: OrgSchema },
      { name: OrgUser.name, schema: OrgUserSchema },
      { name: OrgUserInvite.name, schema: OrgUserInviteSchema },
    ]),
    CustomJwtModule,
    forwardRef(() => UserModule),
  ],
  controllers: [OrgController],
  providers: [OrgService, MailService],
  exports: [OrgService],
})
export class OrgModule {}
