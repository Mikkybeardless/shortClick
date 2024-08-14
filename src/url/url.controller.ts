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
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { UrlService } from './url.service.js';
import { CreateUrlDto } from './dto/create-url.dto.js';
import { UserPayload } from 'src/auth/auth.service.js';
import { Request, Response } from 'express';
import { Url } from './entities/url-entity.dto.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('urls')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post()
  async create(
    @Body() createUrlDto: CreateUrlDto,
    @Req() req: Request & { user: UserPayload | undefined },
  ) {
    return this.urlService.createShortUrl(createUrlDto, req);
  }

  @UseGuards(AuthGuard)
  @Get(':id/qrcode')
  async getQrCode(@Param('id') id: string, @Res() res: Response) {
    const response = await this.urlService.getQrCode(id, res);

    return response;
  }

  @Get(':ownerId')
  findAll(@Param('ownerId') ownerId: string) {
    return this.urlService.findAll(ownerId);
  }

  @Get(':id/analytics')
  async getUrlAnalytics(@Param('id') id: string): Promise<any> {
    const url: Url = (await this.urlService.findById(id)) as Url;

    return { clicks: url.clicks, analytics: url.analytics };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.urlService.remove(id);
  }
}
