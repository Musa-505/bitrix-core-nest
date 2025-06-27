// core-service/src/rabbit/producer.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class ProducerService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly maxRetries = 10; // Максимальное количество попыток
  private readonly retryDelayMs = 2000; // Задержка между попытками в мс

  async onModuleInit() {
    await this.connectRabbitMQ();
  }

  private async connectRabbitMQ(retries = 0) {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq');
      this.channel = await this.connection.createChannel();
      console.log('✅ RabbitMQ Producer connected.');
    } catch (error) {
      if (retries < this.maxRetries) {
        console.warn(`⚠️ Failed to connect to RabbitMQ for Producer. Retrying in ${this.retryDelayMs / 1000}s... (Attempt ${retries + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelayMs));
        await this.connectRabbitMQ(retries + 1);
      } else {
        console.error('❌ Failed to connect to RabbitMQ for Producer after multiple retries:', error.message);
      }
    }
  }

  async onModuleDestroy() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    console.log('🔌 RabbitMQ Producer disconnected.');
  }

  async sendUserEvent(action: string, user: any, replyQueue = 'bitrix.responses') {
    // Убедимся, что канал инициализирован перед отправкой
    if (!this.channel) {
      console.error('❌ RabbitMQ channel not initialized for Producer. Attempting to reconnect...');
      await this.connectRabbitMQ(); // Попытка переподключения
      if (!this.channel) { // Если переподключение не удалось
        console.error('❌ RabbitMQ channel still not initialized. Message not sent.');
        return;
      }
    }
    const payload = {
      action,
      user,
      replyQueue,
    };
    const queueName = 'bitrix.requests';
    await this.channel.assertQueue(queueName, { durable: true });
    this.channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)));
    console.log('✅ Sent message to RabbitMQ:', payload);
  }
}