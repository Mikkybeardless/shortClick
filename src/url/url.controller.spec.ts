import { Test, TestingModule } from '@nestjs/testing';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { Url } from './entities/url-entity.dto';
import { getModelToken } from '@nestjs/mongoose';
import { RedisService } from '../redis/redis.service';
import { JwtService } from '@nestjs/jwt'; // Import JwtService
import { AuthGuard } from '../auth/auth.guard';

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

const mockRedisService = {
  getCache: jest.fn(),
  setCache: jest.fn(),
  clearCache: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn(() => true), // Always allow the request in tests
};

describe('UrlController', () => {
  let controller: UrlController;
  // let service: UrlService;
  // let redisService: RedisService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UrlController],
      providers: [
        UrlService,
        { provide: getModelToken(Url.name), useValue: mockUrlModel },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        { provide: AuthGuard, useValue: mockAuthGuard },
      ],
    }).compile();

    controller = moduleRef.get<UrlController>(UrlController);
    // service = moduleRef.get<UrlService>(UrlService);
    // redisService = moduleRef.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
