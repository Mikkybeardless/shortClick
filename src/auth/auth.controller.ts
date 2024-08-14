import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ValidationPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Redirect,
  Request,
} from '@nestjs/common';
import { AuthService, UserPayload } from './auth.service.js';
import { CreateAuthDto } from './dto/create-auth.dto.js';
import { UpdateAuthDto } from './dto/update-auth.dto.js';
import { AuthGuard } from './auth.guard.js';
import { SigninDto } from './dto/signin-auth.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Sign up
  @HttpCode(HttpStatus.OK)
  @Post('register')
  signUp(@Body() createDto: CreateAuthDto) {
    return this.authService.signUp(createDto);
  }

  // Get sign up page
  @UseGuards(AuthGuard)
  @Get('register')
  @Redirect('https://localhost:3000/registerTest')
  getRegisterPage() {
    return `registration page`;
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req: Request & { user: UserPayload | undefined }) {
    return req.user;
  }

  @Get('users')
  getUsers() {
    const users = this.authService.findAll();
    console.log(users);
    return users;
  }

  //Post sign in
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: SigninDto) {
    return this.authService.signIn(signInDto);
  }

  // Get sign in page
  @Get('login')
  @Redirect('https://localhost:3000/login')
  getLoginPage() {
    return `login page`;
  }

  // DELETE /auths/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(id);
  }
}
