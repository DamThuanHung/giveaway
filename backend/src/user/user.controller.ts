import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() body: any) {
    return this.userService.createUser(body);
  }

  @Get()
  getUsers() {
    return this.userService.getUsers();
  }

  @Post('login')
  login(@Body() body: any) {
    return this.userService.login(body);
  }
}