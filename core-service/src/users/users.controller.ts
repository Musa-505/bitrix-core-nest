// core-service/src/users/users.controller.ts
import { Controller, Post, Body, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserStage } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  create(@Body() body: { full_name: string; phone: string; stage?: UserStage }) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { full_name?: string; phone?: string; stage?: UserStage }) {
    return this.service.update(+id, body);
  }

  @Post(':id/move')
  move(@Param('id') id: string, @Body('stage') stage: UserStage) {
    return this.service.move(+id, stage);
  }
}