import { Controller, Get, Param, Put, Body, Post } from "@nestjs/common";
import { UserService } from "./user.service";

@Controller("ad/user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(":username")
  async getLdapUser(@Param("username") username: string) {
    if (!username) {
      throw new Error("Informar o usuário");
    }
    if (username.length < 4) {
      throw new Error("Informar mais de 4 caracteres");
    }
    return this.userService.getLdapUser(username);
  }

  @Put(":username/reset-password")
  async resetUserPassword(
    @Param("username") username: string,
    @Body() body?: { newPassword?: string },
  ) {
    if (!username) {
      throw new Error("Informar o usuário");
    }
    if (username.length < 4) {
      throw new Error("Informar mais de 4 caracteres");
    }

    const newPassword = body?.newPassword;
    return this.userService.resetUserPassword(username, newPassword);
  }

  @Post(":username/test-authentication")
  async testAuthentication(
    @Param("username") username: string,
    @Body() body: { password: string },
  ) {
    if (!username) {
      throw new Error("Informar o usuário");
    }
    if (username.length < 4) {
      throw new Error("Informar mais de 4 caracteres");
    }
    if (!body.password) {
      throw new Error("Informar a senha para teste");
    }

    return this.userService.testUserAuthentication(username, body.password);
  }

  @Put(":username/reset-and-test")
  async resetAndTest(
    @Param("username") username: string,
    @Body() body?: { newPassword?: string },
  ) {
    if (!username) {
      throw new Error("Informar o usuário");
    }
    if (username.length < 4) {
      throw new Error("Informar mais de 4 caracteres");
    }

    const newPassword = body?.newPassword;
    return this.userService.resetAndTestPassword(username, newPassword);
  }
}
