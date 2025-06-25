import { Controller, Post, Body, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  create(@Body() body) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body) {
    return this.service.update(+id, body);
  }

  @Post(':id/move')
  move(@Param('id') id: string, @Body('stage') stage: string) {
    return this.service.move(+id, stage);
  }
}