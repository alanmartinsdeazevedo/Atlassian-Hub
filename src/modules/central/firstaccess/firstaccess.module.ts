import { Module } from "@nestjs/common";
import { FirstAccessService } from "./firstaccess.service";
import { FirstAccessController } from "./firstaccess.controller";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [HttpModule],
  controllers: [FirstAccessController],
  providers: [FirstAccessService],
})
export class FirstAccessModule {}
