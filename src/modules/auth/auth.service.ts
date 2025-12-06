import {
  BadRequestException,
  Body,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Auth } from './entities/auth.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SigninDto } from './dto/signin-auth.dto';
import { Types } from 'mongoose';
import _ from 'lodash';
import { SYSTEM_MESSAGES } from 'src/common/constants/system-messages';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Auth.name) private readonly authModel: Model<Auth>,
    private readonly jwtService: JwtService,
  ) {}

  // Hashing a password
  private readonly saltRounds = 10;
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  }

  private readonly generateToken = async (user: User) => {
    const payload: UserPayload = {
      role: user.role || 'user',
      email: user.email,
      name: user.username,
      id: user._id,
      sub: user._id,
    };

    const token = await this.jwtService.signAsync(payload);
    return token;
  };

  // Comparing a password
  async comparePassword(plainPassword: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hash);
  }

  async signUp(createAuthDto: CreateAuthDto) {
    let { username, email, password, role } = createAuthDto;
    const existingUser = await this.authModel.findOne({ email });

    if (existingUser) {
      throw new UnauthorizedException(SYSTEM_MESSAGES.AUTH_USER_EXISTS);
    }

    password = await this.hashPassword(password);
    const newAuth = {
      username,
      email,
      password,
      role,
    };

    const unSaveUser = new this.authModel(newAuth);
    await unSaveUser.save();
    // delete (user as { password?: string }).password;
    const token = await this.generateToken(unSaveUser);
    const user = _.omit(unSaveUser.toObject(), ['password']);

    return {
      statusCode: 201,
      message: SYSTEM_MESSAGES.AUTH_REGISTER_SUCCESS,
      data: user,
      accessToken: token,
    };
  }

  async signIn(@Body() signInDto: SigninDto) {
    const { email, password } = signInDto;
    if (!email || !password) {
      throw new BadRequestException('enter username and email');
    }
    const user = await this.authModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!(await this.comparePassword(password, user.password))) {
      throw new UnauthorizedException('Invalid username or password');
    }
    const token = await this.generateToken(user);
    const UserPayload = _.omit(user.toObject(), ['password']);
    return {
      statusCode: 200,
      message: SYSTEM_MESSAGES.AUTH_LOGIN_SUCCESS,
      data: UserPayload,
      access_token: token,
    };
  }

  async findAll(options: FindAllQuery) {
    const query: FindAllQuery | undefined = {};

    if (options.email) query['email'] = options.email;

    if (options.username) query['username'] = options.username;

    const auths = await this.authModel.find({ ...query });

    return {
      message: SYSTEM_MESSAGES.AUTH_USER_RETRIEVE_SUCCESS,
      data: auths,
    };
  }

  async update(id: number, updateAuthDto: UpdateAuthDto) {
    const { username, password } = updateAuthDto;

    if (!username && !password) {
      throw new BadRequestException('Bad request, no data to update');
    }

    const updateData: any = {};
    if (username) updateData['username'] = username;
    if (password) updateData['password'] = password;

    const user = await this.authModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!user) {
      return {
        message: 'User not found',
        data: null,
      };
    }

    return {
      message: SYSTEM_MESSAGES.UPDATE_SUCCESS,
      data: {
        user,
      },
    };
  }

  async remove(id: string) {
    await this.authModel.findByIdAndDelete(id);
    return {
      message: SYSTEM_MESSAGES.DELETE_SUCCESS,
    };
  }
}
