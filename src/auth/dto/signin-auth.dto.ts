import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SigninDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'invalid email' })
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
