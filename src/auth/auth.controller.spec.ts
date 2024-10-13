import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Auth } from './entities/auth.entity';
import { getModelToken } from '@nestjs/mongoose';
import { AuthGuard } from './auth.guard';
import { NotFoundException } from '@nestjs/common';

const mockAuthModel = {
  // Mock Mongoose methods such as findOne, save, findById, etc.
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  findByIdAndDelete: jest.fn(),
};
const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn(() => true), // Always allow the request in tests
  canDeActivate: jest.fn(() => false),
};
describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: getModelToken(Auth.name),
          useValue: mockAuthModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService, // Mock JwtService if needed
        },
        { provide: AuthGuard, useValue: mockAuthGuard },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });
  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('findAll', () => {
    const user = {
      email: 'test123@gmail.com',
      username: 'testUser1',
      page: 3,
    };

    it('should return an array of users', async () => {
      const result = {
        message: 'All users',
        users: [
          { username: 'igashi', email: '123', role: 'users' },
          { username: 'igashi2', email: '1234', role: 'users' },
        ],
        statusCode: 200,
      };

      jest.spyOn(authService, 'findAll').mockResolvedValue(result as any);

      expect(
        await authController.findAll(
          user['email'],
          user['username'],
          user['page'],
        ),
      ).toEqual(result);
    });

    // it('should Not return users unauthorized', async () => {
    //   mockAuthGuard.canDeActivate;
    //   jest.spyOn(authService, 'findAll').mockResolvedValue(null as any);

    //   await expect(
    //     authController.findAll(user['email'], user['username'], user['page']),
    //   ).rejects.toThrow(NotFoundException);
    // });
  });
});
