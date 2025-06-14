import { Injectable } from "@nestjs/common";
import { PrismaService } from "common/services/prisma.service";
import { LdapService } from "common/utils/ldap.utils";

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ldapService: LdapService,
  ) {}

  async getLdapUser(username: string) {
    return this.ldapService.getUserInfo(username);
  }

  async resetUserPassword(username: string, newPassword?: string) {
    try {
      const result = await this.ldapService.resetUserPasswordSSL(
        username,
        newPassword,
      );

      if (result.success) {
        return {
          success: true,
          message: "Senha resetada com sucesso",
          username: username,
          newPassword: result.newPassword,
        };
      } else {
        return {
          success: false,
          message: result.message || "Falha ao resetar senha",
          username: username,
        };
      }
    } catch (error) {
      console.error("Erro no service ao resetar senha:", error);
      return {
        success: false,
        message: "Erro interno ao processar reset de senha",
        username: username,
      };
    }
  }

  async testUserAuthentication(username: string, password: string) {
    try {
      const result = await this.ldapService.testAuthentication(
        username,
        password,
      );

      if (result.success) {
        return {
          success: true,
          message: "Autenticação realizada com sucesso",
          username: username,
          userInfo: result.userInfo,
          authTime: result.authTime,
          debugInfo: result.debugInfo,
        };
      } else {
        return {
          success: false,
          message: result.message || "Falha na autenticação",
          username: username,
          error: result.error,
          debugInfo: result.debugInfo,
        };
      }
    } catch (error) {
      console.error("Erro no service ao testar autenticação:", error);
      return {
        success: false,
        message: "Erro interno ao testar autenticação",
        username: username,
      };
    }
  }

  async resetAndTestPassword(username: string, newPassword?: string) {
    try {
      console.log(`🔄 Iniciando reset + teste para usuário: ${username}`);

      // Etapa 1: Reset da senha
      console.log("📝 Etapa 1: Resetando senha...");
      const resetResult = await this.ldapService.resetUserPasswordSSL(
        username,
        newPassword,
      );

      if (!resetResult.success) {
        return {
          success: false,
          message: "Falha no reset de senha",
          username: username,
          step: "reset",
          resetResult: resetResult,
        };
      }

      console.log(
        `✅ Reset bem-sucedido. Nova senha: ${resetResult.newPassword}`,
      );

      // Aguardar um pouco para o AD processar a mudança
      console.log("⏳ Aguardando 2 segundos para propagação...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Etapa 2: Teste de autenticação
      console.log("🔐 Etapa 2: Testando autenticação...");
      const authResult = await this.ldapService.testAuthentication(
        username,
        resetResult.newPassword!,
      );

      return {
        success: authResult.success,
        message: authResult.success
          ? "Reset e teste realizados com sucesso"
          : "Reset OK, mas teste de autenticação falhou",
        username: username,
        newPassword: resetResult.newPassword,
        resetResult: {
          success: resetResult.success,
          message: resetResult.message,
        },
        authResult: {
          success: authResult.success,
          message: authResult.message,
          error: authResult.error,
          authTime: authResult.authTime,
          debugInfo: authResult.debugInfo,
        },
      };
    } catch (error) {
      console.error("Erro no service ao resetar e testar:", error);
      return {
        success: false,
        message: "Erro interno ao processar reset e teste",
        username: username,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
