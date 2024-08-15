import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateQRcodeDto {
  @IsNotEmpty()
  @IsUrl({}, { message: 'Invalid URL format' })
  url: string;
}
