import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OrgModule } from '../org/org.module';
import { UserModule } from '../user/user.module';
import { CustomJwtModule } from '../utils/custom-jwt/custom-jwt.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => OrgModule),
    CustomJwtModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}