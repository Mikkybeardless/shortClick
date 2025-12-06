import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../role/roles.enum';

export class CreateAuthDto {
  @ApiProperty({ example: 'john_doe', description: 'The username of the user' })
  @IsNotEmpty({ message: 'Username should not be empty' })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'The email of the user',
  })
  @IsNotEmpty()
  @IsEmail({}, { message: 'invalid email' })
  email: string;

  @ApiProperty({
    example: 'strongPassword123',
    minimum: 8,
    description: 'The password of the user',
  })
  @MinLength(8)
  @IsNotEmpty({ message: 'Password field is required' })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    example: 'user',
    description: 'The role of the user',
  })
  @IsString()
  @IsOptional()
  role?: Role;
}
