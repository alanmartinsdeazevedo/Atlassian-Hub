import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { PrismaService } from "common/services/prisma.service";
import { LdapService } from "common/utils/ldap.utils";

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService, PrismaService, LdapService],
  exports: [UserService],
})
export class UserModule {}
