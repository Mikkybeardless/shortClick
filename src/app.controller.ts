import {
  Controller,
  Get,
  Param,
  Redirect,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service.js';
import { UrlService } from './url/url.service.js';
import { Request } from 'express';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly urlService: UrlService,
  ) {}
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-cache')
  async testCache() {
    return await this.appService.testCache();
  }

  @Get(':id')
  @Redirect()
  async redirect(@Param('id') id: string, @Req() req: Request) {
    const { origUrl } = await this.urlService.findAndUpdateClicks(id, req);
    return { url: origUrl };
  }
}
