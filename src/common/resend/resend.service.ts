import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(
      this.configService.get<string>('app.resendApiKey') || '',
    );
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const from = this.configService.get<string>('app.resendFromEmail');
      const data = await this.resend.emails.send({
        from: from || 'mikkybeardless@gmail.com',
        to,
        subject,
        html,
      });
      return data;
    } catch (error) {
      throw new BadGatewayException('Failed to send email');
    }
  }
}
