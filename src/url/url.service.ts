// url.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
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
      console.log(error);
      throw new Error('Failed to generate QR code');
    }
  }

  private validateUrl = (value: string) => {
    const urlPattern =
      /^(https?:\/\/)?([\w\d-]+\.)+\w{2,}(\/[\w\d-.,@?^=%&:/~+#]*)?$/i;
    return urlPattern.test(value);
  };
  public getIpDetails = async (
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
    const { origUrl, customDomain, customSlug } = createUrlDto;
    const owner = req.user?.id;
    console.log(owner);

    const isValidUrl = this.validateUrl(origUrl);

    if (isValidUrl !== true) {
      throw new BadRequestException('Invalid URL');
    }

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

    const newUrl = await this.urlModel.create({
      origUrl,
      shortUrl,
      urlId,
      customDomain,
      customSlug,
      owner,
    });

    return newUrl;
  }

  async findAndUpdateClicks(id: string, req: Request) {
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
  }

  async findById(id: string) {
    const url = await this.urlModel.findById(id);
    if (!url) {
      throw new NotFoundException('URL with this id not not found');
    }

    return url;
  }

  async createQrCode(urlData: CreateQRcodeDto) {
    const { url } = urlData;
    const existingUrl = await this.urlModel.findOne({ shortUrl: url });

    if (existingUrl?.qrCode) {
      const img = existingUrl.qrCode;
      return img
    }
    const qrCodeDataUrl = await this.generateQrCode(url);
    console.log(qrCodeDataUrl);
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

    return qrCode;
  }

  async findAll(req: Request & { user: UserPayload | undefined }) {
    const owner = req.user?.id;

    console.log(owner);
    const cachedData = await this.redisService.getCache('owner_URLs');

    if (cachedData !== null && cachedData !== undefined) {
      console.log('returning data from cache');
      return {
        message: `urls created by user with id ${owner}`,
        data: cachedData,
        statusCode: 200,
      };
    }
    const urls = await this.urlModel.find({ owner: owner });

    if (!urls) {
      throw new NotFoundException('URLs not found');
    }
    console.log('Cache miss setting data in cache');
    await this.redisService.setCache('owner_URLs', urls, 3000);
    console.log('returning data from DB');
    return {
      message: `urls created by user with id ${owner}`,
      data: urls,
      statusCode: 200,
    };
  }

  async removeUrl(id: string): Promise<resp> {
    const url = await this.urlModel.findByIdAndDelete(id);

    if (!url) throw new NotFoundException('URL not found');
    return {
      message: `url with id ${id} deleted successfully`,
      statusCode: 200,
    };
  }
}
