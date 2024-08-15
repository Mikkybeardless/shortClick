import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UrlService } from './url.service';
import { Url } from './entities/url-entity.dto';
import { RedisService } from '../redis/redis.service';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

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
          useValue: {
            findOne: jest.fn(),
            findById: jest.fn(),
            findOneAndUpdate: jest.fn(),
            find: jest.fn(),
            findByIdAndDelete: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getCache: jest.fn(),
            setCache: jest.fn(),
          },
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
    it('should create and return a new short URL', async () => {
      const createUrlDto = {
        origUrl: 'http://example.com',
        customDomain: '',
        customSlug: '',
      };
      const req = { user: { id: 'userId' } } as any;

      jest.spyOn(urlModel, 'findOne').mockResolvedValue(null);
      jest.spyOn(urlModel.prototype, 'save').mockResolvedValue({
        origUrl: 'http://example.com',
        shortUrl: 'http://short.url/abcd',
        urlId: 'abcd',
        owner: 'userId',
      } as any);

      const result = await service.createShortUrl(createUrlDto, req);

      expect(result).toEqual(
        expect.objectContaining({
          origUrl: 'http://example.com',
          shortUrl: expect.any(String),
          urlId: expect.any(String),
          owner: 'userId',
        }),
      );
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
    it('should update clicks and return the updated URL', async () => {
      const id = 'abcd';
      const req = {} as any;

      const updatedUrl = {
        urlId: 'abcd',
        clicks: 1,
        country: ['US'],
        timestamp: [new Date()],
      };

      jest
        .spyOn(urlModel, 'findOneAndUpdate')
        .mockResolvedValue(updatedUrl as any);

      const result = await service.findAndUpdateClicks(id, req);

      expect(result).toEqual(updatedUrl);
    });

    it('should throw NotFoundException if URL not found', async () => {
      const id = 'abcd';
      const req = {} as any;

      jest.spyOn(urlModel, 'findOneAndUpdate').mockResolvedValue(null);

      await expect(service.findAndUpdateClicks(id, req)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findById', () => {
    it('should return the URL from cache if present', async () => {
      const id = 'abcd';
      const cachedUrl = {
        urlId: 'abcd',
        shortUrl: 'http://short.url/abcd',
      };

      jest.spyOn(redisService, 'getCache').mockResolvedValue(cachedUrl as any);

      const result = await service.findById(id);

      expect(result).toEqual(cachedUrl);
    });

    it('should return the URL from the database if not cached', async () => {
      const id = 'abcd';
      const dbUrl = {
        urlId: 'abcd',
        shortUrl: 'http://short.url/abcd',
      };

      jest.spyOn(redisService, 'getCache').mockResolvedValue({ data: null });
      jest.spyOn(urlModel, 'findById').mockResolvedValue(dbUrl as any);

      const result = await service.findById(id);

      expect(result).toEqual(dbUrl);
      expect(redisService.setCache).toHaveBeenCalledWith(
        expect.any(String),
        dbUrl,
      );
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
