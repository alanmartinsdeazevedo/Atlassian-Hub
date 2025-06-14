import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { PrismaService } from "common/services/prisma.service";
import { LoggingUtils } from "common/utils/logging.utils";

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, LoggingUtils],
  exports: [UsersService, LoggingUtils],
})
export class UsersModule {}
