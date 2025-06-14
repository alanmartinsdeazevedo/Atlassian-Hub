import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ResetPasswordController } from "./reset-password.controller";
import { ResetPasswordService } from "./reset-password.service";

@Module({
  imports: [HttpModule],
  controllers: [ResetPasswordController],
  providers: [ResetPasswordService],
})
export class ResetPasswordModule {}
