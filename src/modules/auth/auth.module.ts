import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaService } from "common/services/prisma.service";
import { LoggingUtils } from "common/utils/logging.utils";

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, LoggingUtils],
})
export class AuthModule {}
