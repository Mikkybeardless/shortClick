import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { SigninDto } from './dto/signin-auth.dto';
import { RoleGuard } from './guards/role.guard';
import { Roles, SkipAuth } from './decorators';
import { Role } from '../auth/role/roles.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SYSTEM_MESSAGES } from 'src/common/constants/system-messages';
import { ResetPasswordAuthDto } from './dto/resetPassword-auth.dto';
import { ForgotPasswordAuthDto } from './dto/forgotPassword-auth.dto';

@ApiTags('auth')
@Controller('auth')
@UseGuards(RoleGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Sign up
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @SkipAuth()
  signUp(@Body() createDto: CreateAuthDto) {
    const result = this.authService.signUp(createDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: SYSTEM_MESSAGES.AUTH_REGISTER_SUCCESS,
      ...result,
    };
  }

  @Get('users')
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully.',
  })
  findAll(
    @Query('email') email: string,
    @Query('username') username: string,
    @Query('page') page: number,
  ) {
    const result = this.authService.findAll({ email, username, page });
    return {
      statusCode: HttpStatus.OK,
      message: SYSTEM_MESSAGES.SUCCESS,
      ...result,
    };
  }

  // PATCH /auths/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User successfully updated.' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  @Roles(Role.User, Role.Admin)
  protected update(
    @Param('id') id: string,
    @Body() updateAuthDto: UpdateAuthDto,
  ) {
    return this.authService.update(+id, updateAuthDto);
  }

  //Post sign in
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'User sign in' })
  @ApiResponse({ status: 200, description: 'User successfully signed in.' })
  @SkipAuth()
  @Roles(Role.User, Role.Admin)
  signIn(
    @Body(
      new ValidationPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    signInDto: SigninDto,
  ) {
    const result = this.authService.signIn(signInDto);
    return {
      statusCode: HttpStatus.OK,
      message: SYSTEM_MESSAGES.AUTH_LOGIN_SUCCESS,
      ...result,
    };
  }

  // Forgot password
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  @ApiOperation({ summary: 'User forgot password' })
  @ApiResponse({
    status: 200,
    description: 'Password reset link sent successfully.',
  })
  @SkipAuth()
  forgotPassword(@Body() forgotDto: ForgotPasswordAuthDto) {
    const { email, resetUrl } = forgotDto;
    const result = this.authService.forgotPassword(email, resetUrl);
    return {
      statusCode: HttpStatus.OK,
      message: SYSTEM_MESSAGES.SUCCESS,
      ...result,
    };
  }

  // Reset password
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  @ApiOperation({ summary: 'User reset password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @SkipAuth()
  resetPassword(@Body() restData: ResetPasswordAuthDto) {
    const { email, token, newPassword } = restData;
    this.authService.resetPassword(email, token, newPassword);
    return {
      statusCode: HttpStatus.OK,
      message: SYSTEM_MESSAGES.SUCCESS,
    };
  }

  // DELETE /auths/:id
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User successfully deleted.' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles(Role.Admin)
  async remove(@Param('id') id: string) {
    await this.authService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: SYSTEM_MESSAGES.DELETE_SUCCESS,
    };
  }
}
