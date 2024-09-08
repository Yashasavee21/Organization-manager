import { Module } from '@nestjs/common';
import { CustomJwtService } from './custom-jwt.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  providers: [CustomJwtService],
  exports: [CustomJwtService],
})
export class CustomJwtModule {}
