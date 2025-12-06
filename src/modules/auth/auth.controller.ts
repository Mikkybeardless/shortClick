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
    return this.authService.signUp(createDto);
  }

  // Get sign up page

  @Get('register')
  @Redirect('https://localhost:3000/registerTest')
  getRegisterPage() {
    return `registration page`;
  }

  @Get('profile')
  getProfile(@Request() req: Request & { user: UserPayload | undefined }) {
    return req.user;
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
    return this.authService.findAll({ email, username, page });
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
    return this.authService.signIn(signInDto);
  }

  // Get sign in page
  @Get('login')
  @SkipAuth()
  @Redirect('https://localhost:3000/login')
  getLoginPage() {
    return `login page`;
  }

  // DELETE /auths/:id
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User successfully deleted.' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.authService.remove(id);
  }
}
