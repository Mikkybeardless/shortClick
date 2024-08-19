import { IsString, IsEmail, IsNotEmpty } from 'class-validator';
import { Role } from '../entities/auth.entity';

export class CreateAuthDto {
  @IsNotEmpty({ message: 'Username should not be empty' })
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'invalid email' })
  email: string;

  @IsNotEmpty({ message: 'Password field is required' })
  @IsString()
  password: string;

  @IsString()
  role?: Role;
}
