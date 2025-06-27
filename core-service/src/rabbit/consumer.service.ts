// core-service/src/rabbit/consumer.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as amqp from 'amqplib';
import { User } from '../users/user.entity';

@Injectable()
export class ConsumerService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly replyQueue = 'bitrix.responses';
  private readonly maxRetries = 10; // Максимальное количество попыток
  private readonly retryDelayMs = 2000; // Задержка между попытками в мс

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.connectRabbitMQAndConsume();
  }

  private async connectRabbitMQAndConsume(retries = 0) {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq');
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.replyQueue, { durable: true });
      console.log(`✅ RabbitMQ Consumer listening on queue: ${this.replyQueue}`);

      this.channel.consume(
        this.replyQueue,
        async (msg) => {
          if (msg !== null) {
            try {
              const message = JSON.parse(msg.content.toString());
              console.log(`📩 Received Bitrix response:`, message);

              if (message.status === 'success' && message.userId) {
                const user = await this.userRepository.findOneBy({ id: message.userId });

                if (user) {
                  // Обновляем bitrix_id только для action 'create_card'
                  if (message.action === 'create_card' && message.bitrix_id) {
                    user.bitrix_id = message.bitrix_id;
                    await this.userRepository.save(user);
                    console.log(
                      `[Core-Service] User ${user.id} updated with bitrix_id: ${user.bitrix_id}`
                    );
                  } else {
                    console.log(
                      `[Core-Service] Bitrix action '${message.action}' successful for userId: ${user.id}`
                    );
                  }
                } else {
                  console.warn(`[Core-Service] User with ID ${message.userId} not found in DB.`);
                }
              } else if (message.status === 'error' && message.userId) {
                console.error(
                  `[Core-Service] Error from Bitrix for userId ${message.userId}:`,
                  message.error
                );
              } else {
                console.warn(`[Core-Service] Unexpected Bitrix response format:`, message);
              }
            } catch (parseError) {
              console.error('❌ Error parsing RabbitMQ message:', parseError);
            } finally {
              this.channel.ack(msg); // Подтверждаем получение сообщения
            }
          }
        },
        { noAck: false }
      );
    } catch (error) {
      if (retries < this.maxRetries) {
        console.warn(`⚠️ Failed to connect to RabbitMQ for Consumer. Retrying in ${this.retryDelayMs / 1000}s... (Attempt ${retries + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelayMs));
        await this.connectRabbitMQAndConsume(retries + 1);
      } else {
        console.error('❌ Failed to connect to RabbitMQ for Consumer after multiple retries:', error.message);
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
    console.log('🔌 RabbitMQ Consumer disconnected.');
  }
}