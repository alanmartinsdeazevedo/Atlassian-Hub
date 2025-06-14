import { Module } from "@nestjs/common";
import { OffboardingService } from "./offboarding/offboarding.service";
import { OffboardingController } from "./offboarding/offboarding.controller";
import { UserController } from "./user/user.controller";
import { UserService } from "./user/user.service";
import { PrismaService } from "common/services/prisma.service";
import { LdapService } from "common/utils/ldap.utils";

@Module({
  imports: [],
  controllers: [UserController, OffboardingController],
  providers: [UserService, OffboardingService, PrismaService, LdapService],
  exports: [UserService, OffboardingService],
})
export class AdModule {}
