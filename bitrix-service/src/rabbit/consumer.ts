import * as amqp from 'amqplib';
import { Queue } from 'bullmq';
import { connection } from '../queue/redis';

export async function startConsumer() {
  const conn = await amqp.connect('amqp://rabbitmq');
  const channel = await conn.createChannel();
  const queue = 'bitrix.requests';
  await channel.assertQueue(queue, { durable: true });

  const jobQueue = new Queue('bitrixQueue', { connection });

  channel.consume(queue, async msg => {
    if (!msg) return;
    const content = JSON.parse(msg.content.toString());
    console.log('📩 Received from Core:', content);
    await jobQueue.add('bitrixJob', content);
    channel.ack(msg);
  });
}

// Для отправки ответа в Core
export async function sendReply(queueName: string, payload: any) {
  const conn = await amqp.connect('amqp://rabbitmq');
  const channel = await conn.createChannel();
  await channel.assertQueue(queueName, { durable: true });
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)));
  await channel.close();
  await conn.close();
}