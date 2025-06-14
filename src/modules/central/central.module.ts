import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { CentralController } from "./central.controller";
import { CentralService } from "./central.service";

@Module({
  imports: [HttpModule],
  controllers: [CentralController],
  providers: [CentralService],
})
export class CentralModule {}
