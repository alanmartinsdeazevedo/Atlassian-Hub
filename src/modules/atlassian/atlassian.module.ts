import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AtlassianController } from "./atlassian.controller";
import { AtlassianService } from "./atlassian.service";
import { PrismaService } from "common/services/prisma.service";
import { LoggingUtils } from "common/utils/logging.utils";

@Module({
  imports: [HttpModule],
  controllers: [AtlassianController],
  providers: [AtlassianService, PrismaService, LoggingUtils],
  exports: [AtlassianService],
})
export class AtlassianModule {}
