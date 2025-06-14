import { Injectable } from "@nestjs/common";
import { PrismaService } from "common/services/prisma.service";
import { CreateOnboardingDto } from "./dto/create-onboarding.dto";
import { LdapService } from "common/utils/ldap.utils";
import { ETL } from "common/utils/etl.utils";
import { OnboardingEntity } from "./entities/onboarding.entity";

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ldapService: LdapService,
  ) {}

  async create(dto: CreateOnboardingDto): Promise<OnboardingEntity> {
    const {
      issueKey,
      issueId,
      name,
      cpf,
      cargo,
      setor,
      departamento,
      gestor,
      cidade_uf,
    } = dto;

    // Transforma os dados usando o ETL
    const userInfo = ETL(
      issueId,
      issueKey,
      name,
      cpf,
      cargo,
      setor,
      departamento,
      gestor,
      cidade_uf,
    );

    console.log("Dados transformados:", userInfo);

    // Cria o novo usuário no LDAP
    try {
      console.log("Criando novo usuário no LDAP...");
      const newUser = await this.ldapService.createUser(userInfo);
      console.log("Novo usuário criado no LDAP:", newUser);

      if (!newUser) {
        throw new Error("Erro ao criar o novo usuário no LDAP");
      }

      // Registra o log no banco de dados
      console.log("dados do log:", {
        issueKey,
        issueId,
        fullName: userInfo.fullName,
        userName: userInfo.sAMAccountName,
        email: userInfo.email,
        password: userInfo.userPass,
        description: userInfo.description,
        department: userInfo.department,
        organizationalUnit: userInfo.organizationalUnit,
        city: userInfo.l,
        state: userInfo.st,
        country: userInfo.c,
      });

      return;
    } catch (error) {
      await this.prisma.onboarding.create({
        data: {
          issue_key: issueKey,
          issue_id: issueId,
          full_name: userInfo.fullName,
          user_name: userInfo.sAMAccountName,
          email: userInfo.email,
          password: userInfo.userPass,
          description: userInfo.description,
          department: userInfo.department,
          organizational_unit: userInfo.organizationalUnit,
          city: userInfo.l,
          state: userInfo.st,
          country: userInfo.c,
          status: "FAILED",
          error_message: error.message,
        },
      });

      throw error;
    }
  }

  async findLog(issueKey: string) {
    console.log(`Buscando ${issueKey} no banco de dados...`);
    const existingLog = await this.prisma.onboarding.findFirst({
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
