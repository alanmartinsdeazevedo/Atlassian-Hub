import { Injectable } from "@nestjs/common";
import { PrismaService } from "common/services/prisma.service";
import { LoggingUtils } from "../../../common/utils/logging.utils";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private loggingUtils: LoggingUtils,
  ) {}

  async findOrCreateUser(userData: {
    ms_id: string;
    name: string;
    email: string;
    profile_image: string;
  }) {
    const { ms_id, name, email, profile_image } = userData;

    try {
      // Verifica se o usuário já existe
      let user = await this.prisma.user.findFirst({
        where: { ms_id },
        include: { role: true },
      });

      if (user) {
        // Usuário existe - atualizar dados e last_login
        const updatedUser = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            // Atualizar dados caso tenham mudado no Microsoft
            name,
            email,
            profile_image: profile_image || user.profile_image,
            last_login: new Date(),
            updated_at: new Date(),
          },
          include: { role: true },
        });

        // Log de login
        await this.loggingUtils.logAction({
          action: "USER_LOGIN",
          response: "Login realizado com sucesso",
          user_id: updatedUser.id,
          customer: "AUTH",
          item_name: updatedUser.name,
          context: "Auth",
        });

        this.loggingUtils.logLocal(
          `Login: ${updatedUser.name} (${updatedUser.email}) - Role: ${updatedUser.role.role}`,
          "Auth",
        );

        return updatedUser;
      }

      // Usuário não existe - criar novo
      // Busca a role "Colaborador" (case insensitive)
      const role = await this.prisma.role.findFirst({
        where: {
          role: {
            equals: "Colaborador",
            mode: "insensitive",
          },
        },
      });

      if (!role) {
        // Se não existir, criar a role Colaborador
        const newRole = await this.prisma.role.create({
          data: {
            role: "Colaborador",
            description: "Usuário colaborador padrão do sistema",
          },
        });

        this.loggingUtils.logLocal(
          `Role 'Colaborador' criada automaticamente`,
          "Auth",
        );

        // Criar usuário com a nova role
        user = await this.prisma.user.create({
          data: {
            ms_id,
            name,
            email,
            profile_image: profile_image || "",
            is_active: true,
            last_login: new Date(),
            role: {
              connect: { id: newRole.id },
            },
          },
          include: { role: true },
        });
      } else {
        // Criar usuário com role existente
        user = await this.prisma.user.create({
          data: {
            ms_id,
            name,
            email,
            profile_image: profile_image || "",
            is_active: true,
            last_login: new Date(),
            role: {
              connect: { id: role.id },
            },
          },
          include: { role: true },
        });
      }

      // Log de registro
      await this.loggingUtils.logAction({
        action: "USER_REGISTER",
        response: "Usuário registrado automaticamente via Microsoft Auth",
        user_id: user.id,
        customer: "AUTH",
        item_name: user.name,
        context: "Auth",
      });

      this.loggingUtils.logLocal(
        `Novo usuário registrado: ${user.name} (${user.email}) - Role: ${user.role.role}`,
        "Auth",
      );

      return user;
    } catch (error) {
      // Log de erro
      await this.loggingUtils.logAction({
        action: "USER_AUTH_ERROR",
        response: `Erro durante autenticação: ${error.message}`,
        customer: "AUTH",
        item_name: email,
        context: "Auth",
      });

      this.loggingUtils.logError(
        `Erro ao verificar/criar usuário ${email}: ${error.message}`,
        "Auth",
      );

      throw new Error(`Erro ao autenticar usuário: ${error.message}`);
    }
  }

  // Método auxiliar para buscar usuário por MS ID (útil para outros serviços)
  async getUserByMsId(ms_id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { ms_id },
        include: {
          role: true,
          _count: {
            select: {
              Log: true,
              AtlassianLog: true,
            },
          },
        },
      });

      return user;
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao buscar usuário por MS ID ${ms_id}: ${error.message}`,
        "Auth",
      );
      return null;
    }
  }

  // Método para atualizar dados do usuário após login (caso os dados do Microsoft tenham mudado)
  async syncUserDataFromMicrosoft(
    ms_id: string,
    microsoftData: {
      name: string;
      email: string;
      profile_image?: string;
    },
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { ms_id },
      });

      if (!user) {
        return null;
      }

      // Verificar se houve mudanças
      const hasChanges =
        user.name !== microsoftData.name ||
        user.email !== microsoftData.email ||
        (microsoftData.profile_image &&
          user.profile_image !== microsoftData.profile_image);

      if (hasChanges) {
        const updatedUser = await this.prisma.user.update({
          where: { ms_id },
          data: {
            name: microsoftData.name,
            email: microsoftData.email,
            ...(microsoftData.profile_image && {
              profile_image: microsoftData.profile_image,
            }),
            updated_at: new Date(),
          },
          include: { role: true },
        });

        await this.loggingUtils.logAction({
          action: "USER_SYNC_MICROSOFT",
          response: "Dados sincronizados com Microsoft",
          user_id: updatedUser.id,
          customer: "AUTH",
          item_name: updatedUser.name,
          context: "Auth",
        });

        this.loggingUtils.logLocal(
          `Dados sincronizados: ${updatedUser.name} (${updatedUser.email})`,
          "Auth",
        );

        return updatedUser;
      }

      return user;
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao sincronizar dados do usuário ${ms_id}: ${error.message}`,
        "Auth",
      );
      throw error;
    }
  }
}
