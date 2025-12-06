// url.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  UseGuards,
  Put,
} from '@nestjs/common';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
// import { Request } from 'express';
import { Url } from './entities/url-entity.dto';
import { CreateQRcodeDto } from './dto/create-qrCode.dto';
import { SYSTEM_MESSAGES } from 'src/common/constants/system-messages';
import { Roles, SkipAuth } from '../auth/decorators';
import { GetUser } from '../auth/decorators';
import { Types } from 'mongoose';
import { RoleGuard } from '../auth/guards/role.guard';
import { Role } from '../auth/role/roles.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('urls')
@Controller('urls')
@UseGuards(RoleGuard)
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post('/user')
  @ApiOperation({ summary: 'Create a short URL for a user' })
  @ApiResponse({ status: 201, description: 'Short URL successfully created.' })
  @ApiBearerAuth()
  @Roles(Role.User, Role.Admin)
  async create(
    @Body() createUrlDto: CreateUrlDto,
    @GetUser('_id') userId: DbId,
  ) {
    const url = await this.urlService.createShortUrl(createUrlDto, userId);
    return {
      statusCode: 201,
      message: SYSTEM_MESSAGES.URL_CREATE_SUCCESS,
      data: url,
    };
  }

  @SkipAuth()
  @ApiOperation({ summary: 'Create a short URL for free users' })
  @ApiResponse({
    status: 201,
    description: 'Short URL successfully created for free user.',
  })
  @Post('/free')
  async createFree(
    @Body() createUrlDto: CreateUrlDto,
    @GetUser('_id') userId: DbId,
  ) {
    const url = await this.urlService.createShortUrl(createUrlDto, userId);
    return {
      statusCode: 201,
      message: SYSTEM_MESSAGES.URL_CREATE_SUCCESS,
      data: url,
    };
  }

  @Put('/qrcode')
  @ApiOperation({ summary: 'Generate QR code for a URL' })
  @ApiResponse({ status: 200, description: 'QR code successfully generated.' })
  @ApiBearerAuth()
  @Roles(Role.User, Role.Admin)
  async getQrCode(@Body() urlData: CreateQRcodeDto) {
    const qrCodeBuffer = await this.urlService.createQrCode(urlData);

    return {
      statusCode: 200,
      message: SYSTEM_MESSAGES.QR_CREATE_SUCCESS,
      QrCode: `data:image/png;base64,${qrCodeBuffer.toString('base64')}`,
    };
  }

  @Get('/user')
  @ApiOperation({ summary: 'Get all URLs for a user' })
  @ApiResponse({
    status: 200,
    description: 'List of URLs retrieved successfully.',
  })
  @ApiBearerAuth()
  @Roles(Role.User, Role.Admin)
  findAll(@GetUser('_id') userId: DbId) {
    const urls = this.urlService.findAll(userId);
    return {
      message: SYSTEM_MESSAGES.URL_RETRIEVE_SUCCESS,
      data: urls,
      statusCode: 200,
    };
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get URL analytics by ID' })
  @ApiResponse({
    status: 200,
    description: 'URL analytics retrieved successfully.',
  })
  @ApiBearerAuth()
  @Roles(Role.User, Role.Admin)
  async getUrlAnalytics(@Param('id') id: string): Promise<any> {
    const url: Url = (await this.urlService.findById(id)) as Url;
    return {
      message: SYSTEM_MESSAGES.SUCCESS,
      clicks: url.clicks,
      analytics: url.analytics,
      statusCode: 200,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a URL by ID' })
  @ApiResponse({ status: 200, description: 'URL successfully deleted.' })
  @ApiBearerAuth()
  @Roles(Role.User, Role.Admin)
  async remove(@Param('id') id: string) {
    await this.urlService.removeUrl(id);
    return {
      message: SYSTEM_MESSAGES.URL_DELETE_SUCCESS,
      statusCode: 200,
    };
  }
}
