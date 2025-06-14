import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "common/services/prisma.service";
import { LdapService } from "common/utils/ldap.utils";
import { DeactivateOffboardingDto } from "./dto/offboarding.dto";

@Injectable()
export class OffboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ldapService: LdapService,
  ) {}

  async deactivate(dto: DeactivateOffboardingDto): Promise<any> {
    try {
      return await this.ldapService.deactivateUserByDescription(dto.cpf);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deactivateByIssue(dto: DeactivateOffboardingDto): Promise<any> {
    try {
      return await this.ldapService.deactivateUserByDescription(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findLog(issueKey: string) {
    console.log(`Buscando ${issueKey} no banco de dados...`);
    const existingLog = await this.prisma.offboarding.findFirst({
      where: {
        issue_key: issueKey,
      },
    });
    if (!existingLog) {
      throw new Error("Log not found");
    }
    console.log("Log encontrado:", existingLog);
    return existingLog;
  }
}
