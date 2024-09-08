import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Query,
  Patch,
} from '@nestjs/common';
import { OrgService } from './org.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto, UpdateOwnerDto } from './dto/update-org.dto';
import { FindOrgDto } from './dto/find-org.dto';
import { AuthGaurd } from '../auth/auth.gaurd';
import { CustomExpressRequest } from '../auth/interfaces';
import {
  InviteQueryDto,
  OrgUserInviteDto,
  ResendInviteDto,
  ResendInviteQuery,
} from './dto/invite-org.dto';
import { Public, SkipOrgAuth } from '../utils/auth';
import { HandleExceptionResponse } from '../utils/custom-response';

@Controller('org')
@UseGuards(AuthGaurd)
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @SkipOrgAuth()
  @Post('findOrg')
  async findOrg(@Body() findOrgDto: FindOrgDto) {
    try {
      return await this.orgService.findOrg(findOrgDto);
    } catch (err) {
      return HandleExceptionResponse('Find Org failed', err);
    }
  }

  @SkipOrgAuth()
  @Post('create')
  async createOrg(
    @Request() req: CustomExpressRequest,
    @Body() createOrgDto: CreateOrgDto,
  ) {
    try {
      return await this.orgService.createOrg(req.user, createOrgDto);
    } catch (err) {
      return HandleExceptionResponse('Creating Org failed', err);
    }
  }

  @Patch('update')
  async updateOrg(
    @Request() req: CustomExpressRequest,
    @Body() updateOrgDto: UpdateOrgDto,
  ) {
    try {
      return await this.orgService.updateOrg(req.user, updateOrgDto);
    } catch (err) {
      return HandleExceptionResponse('Update Org failed', err);
    }
  }

  @Patch('updateOwner')
  async updateOwner(
    @Request() req: CustomExpressRequest,
    @Body() updateOwnerDto: UpdateOwnerDto,
  ) {
    try {
      return await this.orgService.updateOwner(req.user, updateOwnerDto);
    } catch (err) {
      return HandleExceptionResponse('Update owner org failed', err);
    }
  }

  @Post('sendInvite')
  async sendInvite(
    @Request() req: CustomExpressRequest,
    @Body() orgUserInviteDto: OrgUserInviteDto,
  ) {
    try {
      return await this.orgService.sendInvite(req.user, orgUserInviteDto);
    } catch (err) {
      return HandleExceptionResponse('SendInvite failed', err);
    }
  }

  @Post('resendInvite')
  async resendInvite(
    @Request() req: CustomExpressRequest,
    @Body() resendInviteDto: ResendInviteDto,
    @Query() resendInviteQuery: ResendInviteQuery,
  ) {
    try {
      return this.orgService.sendInvite(
        req.user,
        resendInviteDto,
        resendInviteQuery.resend,
      );
    } catch (err) {
      return HandleExceptionResponse('Resend Invite failed', err);
    }
  }

  // todo
  // finalise whether authgaurd is needed
  @Public()
  @Get('acceptInvite')
  async acceptInvite(@Query() inviteQueryDto: InviteQueryDto) {
    try {
      return await this.orgService.acceptInvite(inviteQueryDto);
    } catch (err) {
      return HandleExceptionResponse('Accept Invite failed', err);
    }
  }
}
