import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import {
  UserSession,
  UserSessionSchema,
} from '../auth/schemas/user-session.schema';
import { OrgModule } from '../org/org.module';
import { CustomJwtModule } from '../utils/custom-jwt/custom-jwt.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserSession.name, schema: UserSessionSchema },
    ]),
    CustomJwtModule,
    forwardRef(() => OrgModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
