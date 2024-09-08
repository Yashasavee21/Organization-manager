import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { AppsModule } from './apps/apps.module';

@Module({
  imports: [CommonModule, AppsModule],
  providers: [],
})
export class AppModule {}
