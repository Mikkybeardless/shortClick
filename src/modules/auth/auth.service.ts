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
import _ from 'lodash';
import { SYSTEM_MESSAGES } from 'src/common/constants/system-messages';
import crypto from 'crypto';
import { resetPasswordHtml } from 'src/emailTemplates/reset-password';
import { ResendService } from 'src/common/resend/resend.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Auth.name) private readonly authModel: Model<Auth>,
    private readonly jwtService: JwtService,
    private readonly resendService: ResendService,
  ) {}

  // Hashing a password
  private readonly saltRounds = 10;
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  }
  private generateResetToken() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
    return { resetToken, expiresAt };
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
    const { username, email, role } = createAuthDto;
    let { password } = createAuthDto;
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
      data: user,
      access_token: token,
    };
  }

  async signIn(signInDto: SigninDto) {
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
      data: UserPayload,
      access_token: token,
    };
  }

  async forgotPassword(email: string, resetUrl: string) {
    const user = await this.authModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { resetToken, expiresAt } = this.generateResetToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiresAt = expiresAt;
    await user.save();
    // Construct the reset link using frontend's URL
    const resetLink = `${resetUrl}?token=${resetToken}&email=${encodeURIComponent(
      email,
    )}`;

    const html = resetPasswordHtml(resetLink);
    const data = await this.resendService.sendEmail(
      email,
      'Password Reset Request',
      html,
    );
    return data;
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    const user = await this.authModel.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordTokenExpiresAt: { $gt: new Date() },
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    user.password = await this.hashPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiresAt = undefined;
    await user.save();
  }

  async findAll(options: FindAllQuery) {
    const query: FindAllQuery | undefined = {};

    if (options.email) query['email'] = options.email;

    if (options.username) query['username'] = options.username;

    const auths = await this.authModel.find({ ...query });

    return auths;
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
      throw new NotFoundException(SYSTEM_MESSAGES.NOT_FOUND);
    }

    return user;
  }

  async remove(id: string) {
    await this.authModel.findByIdAndDelete(id);
  }
}
