// url.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Res,
  Req,
  UseGuards,
  Put,
} from '@nestjs/common';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UserPayload } from 'src/auth/auth.service';
import { Request, Response } from 'express';
import { Url } from './entities/url-entity.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CreateQRcodeDto } from './dto/create-qrCode.dto';

@Controller('urls')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @UseGuards(AuthGuard)
  @Post('/user')
  async create(
    @Body() createUrlDto: CreateUrlDto,
    @Req() req: Request & { user: UserPayload | undefined },
  ) {
    return this.urlService.createShortUrl(createUrlDto, req);
  }

  @Post('/free')
  async createFree(
    @Body() createUrlDto: CreateUrlDto,
    @Req() req: Request & { user: UserPayload | undefined },
  ) {
    return this.urlService.createShortUrl(createUrlDto, req);
  }

  @UseGuards(AuthGuard)
  @Put('/qrcode')
  async getQrCode(@Body() urlData: CreateQRcodeDto, @Res() res: Response) {
    const response = await this.urlService.createQrCode(urlData, res);

    return response;
  }

  @UseGuards(AuthGuard)
  @Get('/user')
  findAll(@Req() req: Request & { user: UserPayload | undefined }) {
    return this.urlService.findAll(req);
  }

  @UseGuards(AuthGuard)
  @Get(':id/analytics')
  async getUrlAnalytics(@Param('id') id: string): Promise<any> {
    const url: Url = (await this.urlService.findById(id)) as Url;

    return { clicks: url.clicks, analytics: url.analytics, statusCode: 200 };
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.urlService.removeUrl(id);
  }
}
