// url.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import QRCode from 'qrcode';
import { Request, Response } from 'express';
import axios from 'axios';

import { Url } from './entities/url-entity.dto';
import { CreateUrlDto } from './dto/create-url.dto';
import { UserPayload } from '../auth/auth.service';
import { CreateQRcodeDto } from './dto/create-qrCode.dto';
import { RedisService } from '../redis/redis.service';

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
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';

    for (let i = 0; i < 4; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return id;
  }

  private async generateQrCode(url: string) {
    try {
      // Generate QR code as a data URL (base64 string)
      const qrCodeDataUrl = await QRCode.toDataURL(url);

      return qrCodeDataUrl;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  private getIpDetails = async (
    ip: string | undefined,
    key: string | undefined,
  ) => {
    const url = `http://api.weatherapi.com/v1/current.json?key=${key}&q=${ip}`;
    const response = await axios.get(url);
    return response.data;
  };

  async createShortUrl(
    createUrlDto: CreateUrlDto,
    req: Request & { user: UserPayload | undefined },
  ): Promise<Url> {
    try {
      const { origUrl, customDomain, customSlug } = createUrlDto;
      const owner = req.user?.id;
      console.log(owner);
      const existingUrl = await this.urlModel.findOne({ origUrl: origUrl });
      if (existingUrl) {
        return existingUrl;
      }
      // Generate a unique identifier for the short URL
      let urlId = customSlug || this.generateShortId();

      const existingId = await this.urlModel.findOne({ urlId: urlId });
      if (existingId) urlId = this.generateShortId(); //regenerate urlId

      const base = customDomain || process.env.BASE;
      const shortUrl = `${base}/${urlId}`;

      const newUrl = new this.urlModel({
        origUrl,
        shortUrl,
        urlId,
        customDomain,
        customSlug,
        owner,
      });
      return await newUrl.save();
    } catch (error) {
      console.error('Error creating short URL:', error);
      throw new Error('An error occurred while creating the short URL.');
    }
  }

  async findAndUpdateClicks(id: string, req: Request) {
    try {
      const key: string | undefined = process.env.API_KEY;
      const ip: string | undefined = req.ip;
      const ipDetails = await this.getIpDetails(ip, key);
      const { name, region, country, localtime } = ipDetails.location;

      console.log(name, region, country, localtime);
      const timestamp = new Date();

      const url = await this.urlModel.findOneAndUpdate(
        { urlId: id },
        {
          $inc: { clicks: 1 },
          $push: {
            analytics: {
              country: country,
              timestamp: timestamp,
              clientIp: ip,
              name: name,
              region: region,
              localtime: localtime,
            },
          },
        },
        { new: true },
      );

      if (!url) {
        throw new NotFoundException('Url not found');
      }

      return url;
    } catch (error) {
      console.error('Error finding and updating clicks', error);
      throw new InternalServerErrorException(
        'Something went wrong pls try again later',
      );
    }
  }

  async findById(id: string) {
    try {
      const url = await this.urlModel.findById(id);
      if (!url) {
        throw new NotFoundException('URL with this id not not found');
      }

      return url;
    } catch (error) {
      console.error('Error finding by id:', error);
      throw new InternalServerErrorException(error);
    }
  }

  async createQrCode(urlData: CreateQRcodeDto, res: Response) {
    try {
      const { url } = urlData;
      const existingUrl = await this.urlModel.findOne({ shortUrl: url });

      if (existingUrl?.qrCode) {
        const img = existingUrl.qrCode;

        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': img.length,
        });
        console.log(
          'redisUrl',
          process.env.REDIS_URL,
          process.env.MONGODB_URL,
          process.env.JWT_SECRET,
          process.env.BASE,
          process.env.PORT,
        );
        return res.end(img);
      }
      const qrCodeDataUrl = await this.generateQrCode(url);
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrCode = Buffer.from(base64Data, 'base64');
      const dbUrl = await this.urlModel.findOneAndUpdate(
        { shortUrl: url },
        {
          $set: { qrCode: qrCode },
        },
        { new: true },
      );
      if (!dbUrl) {
        throw new NotFoundException('URL not found');
      }

      const img = qrCode;

      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': img.length,
      });

      return res.end(img);
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Invalid URL format');
    }
  }

  async findAll(ownerId: string) {
    try {
      const cacheKey = `ownerUrls_${ownerId}`;
      const cachedUrls = await this.redisService.getCache(cacheKey);

      if (cachedUrls) {
        console.log('Returning data from cache');
        return cachedUrls;
      }
      console.log('Returning urls from database');
      const urls = this.urlModel.find({ owner: ownerId });
      if (!urls) {
        throw new NotFoundException('URLs not found');
      }
      await this.redisService.setCache(cacheKey, urls, 3000); // Cache TTL (time-to-live) in seconds

      return {
        message: `urls created by user with id ${ownerId}`,
        data: urls,
        statusCode: 200,
      };
    } catch (error) {
      console.error('Error finding all user URLs:', error);
      throw new InternalServerErrorException(
        'Something went wrong pls try again later',
      );
    }
  }

  async removeUrl(id: string): Promise<resp> {
    try {
      const url = await this.urlModel.findByIdAndDelete(id);

      if (!url) throw new NotFoundException('URL not found');
      return {
        message: `url with id ${id} deleted successfully`,
        statusCode: 200,
      };
    } catch (error) {
      console.error('Error finding by id:', error);
      throw new InternalServerErrorException(
        'Something went wrong pls try again later',
      );
    }
  }
}
