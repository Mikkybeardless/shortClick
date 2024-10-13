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
  Redirect,
  Request,
} from '@nestjs/common';
import { AuthService, UserPayload } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { AuthGuard } from './auth.guard';
import { SigninDto } from './dto/signin-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Sign up
  @HttpCode(HttpStatus.CREATED)
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

  @UseGuards(AuthGuard)
  @Get('users')
  findAll(
    @Query('email') email: string,
    @Query('username') username: string,
    @Query('page') page: number,
  ) {
    return this.authService.findAll({ email, username, page });
  }

  // PATCH /auths/:id
  @Patch(':id')
  protected update(
    @Param('id') id: string,
    @Body() updateAuthDto: UpdateAuthDto,
  ) {
    return this.authService.update(+id, updateAuthDto);
  }

  //Post sign in
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(
    @Body(
      new ValidationPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    signInDto: SigninDto,
  ) {
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
