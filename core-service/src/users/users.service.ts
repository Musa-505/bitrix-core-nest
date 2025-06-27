// core-service/src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStage } from './user.entity'; // Импортируем UserStage
import { ProducerService } from '../rabbit/producer.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    private readonly producer: ProducerService,
  ) {}

  async create(userDto: Partial<User>) {
    const user = this.repo.create(userDto);
    await this.repo.save(user);
    await this.producer.sendUserEvent('create_card', user);
    return user;
  }

  async update(id: number, data: Partial<User>) {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new Error('User not found');

    Object.assign(user, data);
    await this.repo.save(user);
    // Отправляем актуальный объект пользователя, который может содержать bitrix_id
    await this.producer.sendUserEvent('update_card', user);
    return user;
  }

  async move(id: number, stage: UserStage) { // Используем UserStage
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new Error('User not found');

    user.stage = stage;
    await this.repo.save(user);
    // Отправляем актуальный объект пользователя, который может содержать bitrix_id
    await this.producer.sendUserEvent('move_card', user);
    return user;
  }
}