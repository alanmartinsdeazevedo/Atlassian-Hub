import { Module } from "@nestjs/common";
import { ResendEmailController } from "./controllers/resend-email.controller";
import { FixitController } from "./controllers/update.controller";
import { GetInfoController } from "./controllers/info.controller";
import { ResendEmailService } from "./services/resend-email.service";
import { FixitService } from "./services/update.service";
import { GetInfoService } from "./services/info.service";
import { CeletiHubAuth } from "../../../../../common/utils/celetihub-auth.utils";

@Module({
  controllers: [ResendEmailController, FixitController, GetInfoController],
  providers: [ResendEmailService, FixitService, GetInfoService, CeletiHubAuth],
})
export class PremiereModule {}
