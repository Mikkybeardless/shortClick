import axios from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.MONDAY_TO_FRIDAY_AT_10AM)
  async handleCron() {
    const date = new Date();
    const time = date.toLocaleTimeString();
    const url = 'https://shortclick.onrender.com';
    this.logger.log('Executing daily cron job'); 
    try {
      // Replace with your base URL or API endpoint
      await axios.get(url);
      this.logger.log('Base URL called successfully. time:', time);
    } catch (error) {
      this.logger.error('Error calling base URL', error);
    }
  }
}
