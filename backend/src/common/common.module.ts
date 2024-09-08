import { Module } from '@nestjs/common';
import MongodbConnection from './db/mongo';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { OrgModule } from './org/org.module';

@Module({
  imports: [MongodbConnection, UserModule, AuthModule, OrgModule],
})
export class CommonModule {}
