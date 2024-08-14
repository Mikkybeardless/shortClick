// url.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import { Request, Response } from 'express';
import geoip from 'geoip-lite';
import { Url } from './entities/url-entity.dto.js';
import { CreateUrlDto } from './dto/create-url.dto.js';
import { UserPayload } from '../auth/auth.service.js';
import { RedisService } from '../redis/redis.service.js';

type resp = {
  message: string;
  statusCode: number;
};
@Injectable()
export class UrlService {
  constructor(
    @InjectModel(Url.name) private urlModel: Model<Url>,
    private redisService: RedisService,
  ) {}

  private generateShortId(): string {
    // logic to generate a unique short ID
    const urlId = nanoid(4);

    return urlId;
  }

  private async generateQrCode(url: Url) {
    try {
      // Generate QR code as a data URL (base64 string)
      const qrCodeDataUrl = await QRCode.toDataURL(url.shortUrl);

      return qrCodeDataUrl;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  private getCountry = (ip: any) => {
    const geo = geoip.lookup(ip);
    return geo?.country;
  };

  async createShortUrl(
    createUrlDto: CreateUrlDto,
    req: Request & { user: UserPayload | undefined },
  ): Promise<Url> {
    const { origUrl, customDomain, customSlug } = createUrlDto;
    const owner = req.user?.id;
    if (owner) {
    }

    const existingUrl = await this.urlModel.findOne({ origUrl: origUrl });
    if (existingUrl) {
      return existingUrl;
    }
    // Generate a unique identifier for the short URL
    let urlId = customSlug || this.generateShortId();
    const existingId = await this.urlModel.findOne({ urlId: urlId });
    if (existingId) urlId = this.generateShortId();
    const base = customDomain || process.env.BASE;
    const shortUrl = `${base}/${urlId}`;
    const newUrl = new this.urlModel({
      origUrl,
      customDomain,
      customSlug,
      shortUrl,
      urlId,
      owner,
    });
    return newUrl.save();
  }

  async findAndUpdateClicks(id: string, req: Request): Promise<Url> {
    const ip = req.ip;
    const country = this.getCountry(ip);
    const timestamp = new Date();

    const url = await this.urlModel.findOneAndUpdate(
      { urlId: id },
      {
        $inc: { clicks: 1 },
        $push: { country: country, timestamp: timestamp },
      },
      { new: true },
    );

    if (!url) {
      throw new NotFoundException('Url not found');
    }

    return url;
  }

  async findById(id: string) {
    const cacheKey = `findById_${id}`;
    const cacheData = this.redisService.getCache(cacheKey);
    if (cacheData) {
      console.log('returning url by id from cache');
      return cacheData;
    }
    const url = await this.urlModel.findById(id);
    if (!url) {
      throw new NotFoundException('Url with this id not not found');
    }

    await this.redisService.setCache(cacheKey, url);
    return url;
  }

  async getConstomUrls(query: string) {
    const cacheKey = `query_${query}`;
    const cacheData = this.redisService.getCache(cacheKey);

    if (cacheData) {
      return cacheData;
    }
    console.log('returning data from database');
    // Find and update the document in one operation
    const url = await this.urlModel.find(
      { customDomain: query }, // Filter criteria
    );

    if (url) {
      await this.redisService.setCache(cacheKey, url);
      return url;
    } else {
      throw new NotFoundException('Url not found');
    }
  }

  async getQrCode(id: string, res: Response) {
    const cacheKey = 'qrCode';
    const cacheQrcode = await this.redisService.getCache(cacheKey);

    if (cacheQrcode) {
      console.log('returning QRCode from cache');
      return res.end(cacheQrcode);
    }

    const url = await this.urlModel.findById(id);
    if (!url) {
      throw new NotFoundException('Url not found');
    }

    const qrCodeDataUrl = await this.generateQrCode(url);
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    const img = Buffer.from(base64Data, 'base64');

    await this.redisService.setCache(cacheKey, img);
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': img.length,
    });

    return res.end(img);
  }

  async findAll(ownerId: string) {
    const cacheKey = `ownerUrls_${ownerId}`;
    const cachedUrls = await this.redisService.getCache(cacheKey);

    if (cachedUrls) {
      console.log('Returning data from cache');
      return cachedUrls;
    }
    console.log('Returning urls from database');
    const urls = this.urlModel.find({ owner: ownerId });
    if (!urls) {
      throw new NotFoundException('Urls not found');
    }
    await this.redisService.setCache(cacheKey, urls); // Cache TTL (time-to-live) in seconds
    return urls;
  }

  async remove(id: string): Promise<resp> {
    await this.urlModel.findByIdAndDelete(id);
    return {
      message: `url with id ${id} deleted successfully`,
      statusCode: 200,
    };
  }
}
