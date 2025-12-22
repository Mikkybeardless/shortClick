import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordAuthDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email of the user requesting password reset',
  })
  @IsNotEmpty({ message: 'Email should not be empty' })
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty({
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    description: 'The password reset token sent to the user email',
  })
  @IsNotEmpty({ message: 'Token should not be empty' })
  @IsEmail({}, { message: 'Invalid token format' })
  token: string;

  @ApiProperty({
    example: 'strongNewPassword123',
    minimum: 8,
    description: 'The new password of the user',
  })
  @MinLength(8)
  @IsNotEmpty({ message: 'Password field is required' })
  @IsEmail({}, { message: 'invalid email' })
  newPassword: string;
}
