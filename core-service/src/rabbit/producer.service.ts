import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class ProducerService implements OnModuleInit {
  private channel: amqp.Channel;

  async onModuleInit() {
    const conn = await amqp.connect('amqp://rabbitmq');
    this.channel = await conn.createChannel();
  }

  async sendUserEvent(action: string, user: any, replyQueue = 'bitrix.responses') {
    const payload = {
      action,
      user,
      replyQueue,
    };
    await this.channel.assertQueue('bitrix.requests', { durable: true });
    this.channel.sendToQueue('bitrix.requests', Buffer.from(JSON.stringify(payload)));
    console.log('✅ Sent message:', payload);
  }
}