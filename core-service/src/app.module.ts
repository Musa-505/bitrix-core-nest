// core-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { ConsumerService } from './rabbit/consumer.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'postgres',
      entities: [User],
      synchronize: true, // В продакшене лучше использовать миграции
      logging: false, // Отключим логирование SQL запросов для чистоты логов
    }),
    TypeOrmModule.forFeature([User]),
    UsersModule,
  ],
  providers: [ConsumerService],
})
export class AppModule {}