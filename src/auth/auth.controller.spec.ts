import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {}, // Mock JwtService if needed
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = {
        message: 'All users',
        users: [{ username: 'igashi', email: '123', role: 'users' }],
        statusCode: 200,
      };

      jest
        .spyOn(authService, 'findAll')
        .mockImplementation(() => Promise.resolve(result));

      expect(await authController.getUsers()).toEqual(result);
    });
  });
});
