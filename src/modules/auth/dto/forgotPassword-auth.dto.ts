import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class ForgotPasswordAuthDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email of the user requesting password reset',
  })
  @IsNotEmpty({ message: 'Email should not be empty' })
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty({
    example: 'https://example.com/reset-password',
    description: 'The URL to redirect the user for password reset',
  })
  @IsNotEmpty({ message: 'Reset URL should not be empty' })
  resetUrl: string;
}
