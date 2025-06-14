import { Module } from "@nestjs/common";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";
import { PrismaService } from "common/services/prisma.service";
import { LdapService } from "common/utils/ldap.utils";

@Module({
  imports: [],
  controllers: [OnboardingController],
  providers: [OnboardingService, PrismaService, LdapService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
