// src/users/users.controller.ts
import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("users")
export class AuthController {
  constructor(private usersService: AuthService) {}

  @Post("auth")
  async findOrCreateUser(
    @Body()
    userData: {
      ms_id: string;
      name: string;
      email: string;
      profile_image: string;
    },
  ) {
    return this.usersService.findOrCreateUser(userData);
  }
}
