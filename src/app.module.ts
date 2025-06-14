import { AdModule } from "./modules/ad/ad.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CentralModule } from "./modules/central/central.module";
import { ResetPasswordModule } from "./modules/central/reset-password/reset-password.module";
import { FirstAccessModule } from "./modules/central/firstaccess/firstaccess.module";
import { OnboardingModule } from "./modules/ad/onboarding/onboarding.module";
import { CeletihubModule } from "./modules/sva/celetihub/globoplay/celetihub.module";
import { PlayhubModule } from "./modules/sva/playhub/playhub.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AtlassianModule } from "./modules/atlassian/atlassian.module";
import { UsersModule } from "./modules/users/users.module";
// import { OffboardingModule } from "./modules/ad/offboarding/offboarding.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CentralModule,
    ResetPasswordModule,
    FirstAccessModule,
    OnboardingModule,
    CeletihubModule,
    PlayhubModule,
    AdModule,
    AuthModule,
    AtlassianModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
