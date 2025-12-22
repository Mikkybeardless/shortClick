// url.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import QRCode from 'qrcode';
import { Request } from 'express';
import axios from 'axios';
import { Url } from './entities/url-entity.dto';
import { CreateUrlDto } from './dto/create-url.dto';
import { CreateQRcodeDto } from './dto/create-qrCode.dto';
import { SYSTEM_MESSAGES } from 'src/common/constants/system-messages';
import { RedisService } from 'src/common/redis/redis.service';

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
      throw new Error(SYSTEM_MESSAGES.FAIL_TO_GENERATE_QR);
    }
  }

  private validateUrl = (value: string) => {
    const urlPattern =
      /^(https?:\/\/)?([\w\d-]+\.)+\w{2,}(\/[\w\d-.,@?^=%&:/~+#]*)?$/i;
    return urlPattern.test(value);
  };
  public getIpDetails = async (ip: string | undefined) => {
    const key: string | undefined = process.env.WEATHER_API_KEY;
    const base = process.env.WEATHER_API_URL;
    const url = `${base}?key=${key}&q=${ip}`;

    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw new Error('failed to get ip details');
    }
  };

  async createShortUrl(createUrlDto: CreateUrlDto, userId: DbId): Promise<Url> {
    const { origUrl, customDomain, customSlug } = createUrlDto;
    const owner = userId;
    const isValidUrl = this.validateUrl(origUrl);

    if (isValidUrl !== true) {
      throw new BadRequestException(SYSTEM_MESSAGES.URL_INVALID);
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

  async createFreeShortUrl(createUrlDto: CreateUrlDto): Promise<Url> {
    const { origUrl, customDomain, customSlug } = createUrlDto;
    const isValidUrl = this.validateUrl(origUrl);

    if (isValidUrl !== true) {
      throw new BadRequestException(SYSTEM_MESSAGES.URL_INVALID);
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
    });

    return newUrl;
  }

  async findAndUpdateClicks(id: string, req: Request) {
    const ip: string | undefined = req.ip;
    const ipDetails = await this.getIpDetails(ip);
    const { name, region, country, localtime } = ipDetails.location;

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
      throw new NotFoundException(SYSTEM_MESSAGES.URL_NOT_FOUND);
    }

    return url;
  }

  async findById(id: string) {
    const url = await this.urlModel.findById(id);
    if (!url) {
      throw new NotFoundException(SYSTEM_MESSAGES.URL_NOT_FOUND);
    }
    return url;
  }

  async createQrCode(urlData: CreateQRcodeDto) {
    const { url } = urlData;
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
      throw new NotFoundException(SYSTEM_MESSAGES.URL_NOT_FOUND);
    }

    return qrCode;
  }

  async findAll(userId: DbId) {
    const owner = userId;

    console.log(owner);
    const cachedUrls = await this.redisService.getCache('owner_URLs');

    if (cachedUrls !== null && cachedUrls !== undefined) {
      console.log('returning data from cache');
      return cachedUrls;
    }
    const urls = await this.urlModel.find({ owner: owner });

    if (!urls) {
      throw new NotFoundException('URLs not found');
    }
    // console.log('Cache miss setting data in cache');
    await this.redisService.setCache('owner_URLs', urls, 3000);
    // console.log('returning data from DB');
    return urls;
  }

  async removeUrl(id: string) {
    const url = await this.urlModel.findByIdAndDelete(id);
    if (!url) throw new NotFoundException(SYSTEM_MESSAGES.URL_NOT_FOUND);
    return;
  }
}
