import { IsString, IsEmail, IsNotEmpty } from 'class-validator';
import { Role } from '../entities/auth.entity.js';

export class CreateAuthDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'invalid email' })
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsString()
  role: Role;
}
