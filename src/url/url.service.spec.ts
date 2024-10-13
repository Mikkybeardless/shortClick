import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UrlService } from './url.service';
import { Url } from './entities/url-entity.dto';
import { RedisService } from '../redis/redis.service';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

// Mock implementations
const mockRedisService = {
  getCache: jest.fn(),
  setCache: jest.fn(),
  clearCache: jest.fn(),
};

const mockUrlModel = {
  // Mock Mongoose methods such as findOne, save, findById, etc.
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  findByIdAndDelete: jest.fn(),
};
// Sample URL data for tests
const mockUrlDoc = {
  origUrl: 'http://example.com',
  shortUrl: 'http://short.ly/abc',
  urlId: 'abc',
  save: jest.fn().mockResolvedValue(true),
};
describe('UrlService', () => {
  let service: UrlService;
  let urlModel: Model<Url>;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlService,
        {
          provide: getModelToken(Url.name),
          useValue: mockUrlModel,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<UrlService>(UrlService);
    urlModel = module.get<Model<Url>>(getModelToken(Url.name));
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createShortUrl', () => {
    const createUrlDto = {
      origUrl: 'http://example.com',
      customDomain: '',
      customSlug: '',
    };
    const req = { user: { id: 'userId' } } as any;
    it('should create and return a new short URL', async () => {
      jest.spyOn(urlModel, 'findOne').mockResolvedValue(null);
      jest.spyOn(urlModel, 'create').mockResolvedValue(mockUrlDoc as any);

      const result = await service.createShortUrl(createUrlDto, req);
      expect(urlModel.findOne).toHaveBeenCalledWith({
        origUrl: createUrlDto.origUrl,
      });
      expect(result).toEqual(mockUrlDoc);
    });

    it('should return existing URL if already exists', async () => {
      const createUrlDto = {
        origUrl: 'http://example.com',
        customDomain: '',
        customSlug: '',
      };
      const req = { user: { id: 'userId' } } as any;
      const existingUrl = {
        origUrl: 'http://example.com',
        shortUrl: 'http://short.url/abcd',
        urlId: 'abcd',
        owner: 'userId',
      };

      jest.spyOn(urlModel, 'findOne').mockResolvedValue(existingUrl as any);

      const result = await service.createShortUrl(createUrlDto, req);

      expect(result).toEqual(existingUrl);
    });
  });

  describe('findAndUpdateClicks', () => {
    const req = { ip: '127.0.0.1' } as any;
    const urlId = 'abc123';
    const apiKey = 'mockApiKey';
    process.env.API_KEY = apiKey;

    const ipDetails = {
      location: {
        name: 'City',
        region: 'Region',
        country: 'Country',
        localtime: '2024-09-01 12:00:00',
      },
    };
    it('should increment clicks and update analytics for a URL', async () => {
      jest.spyOn(service, 'getIpDetails').mockResolvedValue(ipDetails);
      jest.spyOn(urlModel, 'findOneAndUpdate').mockResolvedValue(mockUrlDoc);

      const result = await service.findAndUpdateClicks(urlId, req);

      expect(service.getIpDetails).toHaveBeenCalledWith(
        req.ip,
        process.env.API_KEY,
      );
      expect(urlModel.findOneAndUpdate).toHaveBeenCalledWith(
        { urlId },
        {
          $inc: { clicks: 1 },
          $push: {
            analytics: {
              country: 'Country',
              timestamp: expect.any(Date),
              clientIp: req.ip,
              name: 'City',
              region: 'Region',
              localtime: '2024-09-01 12:00:00',
            },
          },
        },
        { new: true },
      );
      expect(result).toMatchObject({
        origUrl: 'http://example.com',
        shortUrl: 'http://short.ly/abc',
        urlId: 'abc',
      });
    });

    it('should throw NotFoundException if URL not found', async () => {
      jest.spyOn(service, 'getIpDetails').mockResolvedValue(ipDetails);

      jest.spyOn(urlModel, 'findOneAndUpdate').mockResolvedValue(null); // Simulate URL not found

      await expect(service.findAndUpdateClicks(urlId, req)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findById', () => {
    // it('should return the URL from cache if present', async () => {
    //   const id = 'abcd';
    //   const cachedUrl = {
    //     urlId: 'abcd',
    //     shortUrl: 'http://short.url/abcd',
    //   };

    //   jest.spyOn(redisService, 'getCache').mockResolvedValue(cachedUrl as any);

    //   const result = await service.findById(id);

    //   expect(result).toEqual(cachedUrl);
    // });

    it('should return the URL from the database', async () => {
      const id = 'abcd';
      const dbUrl = {
        urlId: 'abcd',
        shortUrl: 'http://short.url/abcd',
      };

      //jest.spyOn(redisService, 'getCache').mockResolvedValue({ data: null });
      jest.spyOn(urlModel, 'findById').mockResolvedValue(dbUrl as any);

      const result = await service.findById(id);

      expect(result).toEqual(dbUrl);
      // expect(redisService.setCache).toHaveBeenCalledWith(
      //   expect.any(String),
      //   dbUrl,
      // );
    });

    it('should throw NotFoundException if URL not found in the database', async () => {
      const id = 'abcd';

      jest.spyOn(urlModel, 'findById').mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeUrl', () => {
    it('should delete the URL and return a success message', async () => {
      const id = 'abcd';

      jest.spyOn(urlModel, 'findByIdAndDelete').mockResolvedValue({} as any);

      const result = await service.removeUrl(id);

      expect(result).toEqual({
        message: `url with id ${id} deleted successfully`,
        statusCode: 200,
      });
    });
  });
});
