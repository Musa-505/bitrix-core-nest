import { Module, OnModuleInit } from '@nestjs/common';
import { QueueModule } from './queue/queue.module';
import { startConsumer } from './rabbit/consumer';

@Module({
  imports: [QueueModule],
})
export class AppModule implements OnModuleInit {
  async onModuleInit() {
    await startConsumer();
  }
}