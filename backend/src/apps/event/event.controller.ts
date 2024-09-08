import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { EventService } from './event.service';
import { EventDataDto } from './dto/event-data.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { IdentifyUserDto } from './dto/identify-user.dto';
import { AuthGaurd } from 'src/common/auth/auth.gaurd';
import { CustomExpressRequest } from 'src/common/auth/interfaces';
import { ResetKeyDto } from './dto/reset-key.dto';
import { HandleExceptionResponse } from 'src/common/utils/custom-response';
import { Public } from 'src/common/utils/auth';
import { EventGaurd } from './event.gaurd';

@Controller('events')
@UseGuards(AuthGaurd)
export class EventController {
  constructor(private readonly eventsService: EventService) {}

  @Post('createChannel')
  async createChannel(
    @Request() req: CustomExpressRequest,
    @Body() createChannelDto: CreateChannelDto,
  ) {
    try {
      return await this.eventsService.createChannel(req, createChannelDto);
    } catch (err) {
      return HandleExceptionResponse('Create channel failed', err);
    }
  }

  @Get('getChannel')
  @UseGuards(EventGaurd)
  async getChannel(@Request() req: CustomExpressRequest) {
    try {
      return await this.eventsService.getChannelByApiKey(req.user, req.event);
    } catch (err) {
      return HandleExceptionResponse('Get channel failed', err);
    }
  }

  @Post('resetApiKey')
  async resetApiKey(
    @Request() req: CustomExpressRequest,
    @Body() resetKeyDto: ResetKeyDto,
  ) {
    try {
      return await this.eventsService.resetApiKey(req.user, resetKeyDto);
    } catch (err) {
      return HandleExceptionResponse('API key reset failed', err);
    }
  }

  @Public()
  @Post('receiveEvent')
  @UseGuards(EventGaurd)
  async receiveEvent(
    @Request() req: CustomExpressRequest,
    @Body() eventDataDto: EventDataDto,
  ) {
    try {
      return await this.eventsService.receiveEvent(
        eventDataDto,
        req.event,
        req.headers?.['user-agent'],
      );
    } catch (err) {
      return HandleExceptionResponse('Event receive failed', err);
    }
  }

  @Post('identifyUser')
  @UseGuards(EventGaurd)
  async identifyUser(
    @Request() req: CustomExpressRequest,
    @Body() identifyUserDto: IdentifyUserDto,
  ) {
    try {
      return await this.eventsService.identifyUser(req, identifyUserDto);
    } catch (err) {
      return HandleExceptionResponse('Identify User failed', err);
    }
  }
}
