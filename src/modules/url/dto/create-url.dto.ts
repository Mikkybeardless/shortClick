import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUrlDto {
  @ApiProperty({ description: 'Original URL to be shortened' })
  @IsNotEmpty()
  @IsUrl({}, { message: 'Invalid URL format' })
  origUrl: string;

  @ApiProperty({
    description: 'Custom domain for the shortened URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  customDomain?: string;

  @ApiProperty({
    description: 'Custom slug for the shortened URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  customSlug?: string;
}
