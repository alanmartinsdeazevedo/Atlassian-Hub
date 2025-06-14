import { Module } from "@nestjs/common";
import { FixitController } from "./controllers/update.controller";
import { GetInfoController } from "./controllers/info.controller";
import { FixitService } from "./services/update.service";
import { GetInfoService } from "./services/info.service";
import { PlayHubAuth } from "../../../../common/utils/playhub-auth.utils";

@Module({
  controllers: [FixitController, GetInfoController],
  providers: [FixitService, GetInfoService, PlayHubAuth],
})
export class PlayhubModule {}
