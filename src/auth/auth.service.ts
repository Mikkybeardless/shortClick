import {
  BadRequestException,
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

export interface UserPayload {
  role: 'user' | 'admin';
  email: string;
  id: Types.ObjectId;
  sub: Types.ObjectId;
}

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

  // Comparing a password
  async comparePassword(plainPassword: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hash);
  }

  async signUp(createAuthDto: CreateAuthDto) {
    let { username, email, password, role } = createAuthDto;
    const existingUser = await this.authModel.findOne({ email });

    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    password = await this.hashPassword(password);
    const newAuth = {
      username,
      email,
      password,
      role,
    };

    const user = new this.authModel(newAuth);
    await user.save();
    delete (user as { password?: string }).password;

    // const token = await this.signIn({ email, password });
    return {
      message: 'User created successfully',
      data: {
        user,
      },
      statusCode: 201,
    };
  }

  async signIn(
    signInDto: SigninDto,
  ): Promise<{ message: string; access_token: string }> {
    const { email, password } = signInDto;
    if (!email || !password) {
      throw new BadRequestException('enter username and email');
    }
    const user = await this.authModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!(await this.comparePassword(password, user.password))) {
      throw new NotFoundException('Invalid username or password');
    }
    const payload: UserPayload = {
      role: user.role || 'user',
      email: user.email,
      id: user._id,
      sub: user._id,
    };

    delete (user as { password?: string }).password;

    return {
      message: 'login successful',
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async findAll() {
    const users = await this.authModel.find({});
    return {
      message: 'All users',
      users,
      statusCode: 200,
    };
  }

  async remove(id: string) {
    await this.authModel.findByIdAndDelete(id);
    return {
      message: `Auth with id ${id} deleted successfully`,
      statusCode: 200,
    };
  }
}
