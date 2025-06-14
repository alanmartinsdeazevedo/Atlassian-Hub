import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "common/services/prisma.service";
import { LoggingUtils } from "common/utils/logging.utils";
import {
  UpdateUserDto,
  ChangeRoleDto,
  GetUsersQueryDto,
  GetUserLogsQueryDto,
} from "./dto/users.dto";

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private loggingUtils: LoggingUtils,
  ) {}

  // ==================== LEITURA DE USUÁRIOS ====================

  async getAllUsers(filters?: {
    isActive?: boolean;
    roleId?: string;
    search?: string;
    orderBy?: "name" | "email" | "created_at" | "last_login";
    orderDirection?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }) {
    try {
      const where: any = {};

      if (filters?.isActive !== undefined) {
        where.is_active = filters.isActive;
      }

      if (filters?.roleId) {
        where.role_id = filters.roleId;
      }

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
          { ms_id: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      const orderBy: any = {};
      if (filters?.orderBy) {
        orderBy[filters.orderBy] = filters.orderDirection || "asc";
      } else {
        orderBy.created_at = "desc";
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          include: {
            role: {
              select: {
                id: true,
                role: true,
                description: true,
              },
            },
            _count: {
              select: {
                Log: true,
                AtlassianLog: true,
              },
            },
          },
          orderBy,
          take: filters?.limit || 50,
          skip: filters?.offset || 0,
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          total,
          limit: filters?.limit || 50,
          offset: filters?.offset || 0,
          hasMore: (filters?.offset || 0) + users.length < total,
        },
      };
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao buscar usuários: ${error.message}`,
        "Users",
      );
      return {
        users: [],
        pagination: {
          total: 0,
          limit: 0,
          offset: 0,
          hasMore: false,
        },
      };
    }
  }

  async getUserById(id: string, includeStats: boolean = false) {
    try {
      const include: any = {
        role: true,
      };

      if (includeStats) {
        include._count = {
          select: {
            Log: true,
            AtlassianLog: true,
          },
        };
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
        include,
      });

      if (!user) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
      }

      let stats = null;
      if (includeStats) {
        stats = await this.getUserStats(id);
      }

      return {
        ...user,
        stats,
      };
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao buscar usuário por ID: ${error.message}`,
        "Users",
      );
      throw error;
    }
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    updatedBy?: string,
  ) {
    try {
      // Verificar se o usuário existe
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
        include: { role: true },
      });

      if (!existingUser) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
      }

      // Verificar se o novo email não está em uso (se estiver sendo alterado)
      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        const existingUserByEmail = await this.prisma.user.findFirst({
          where: {
            email: updateUserDto.email,
            id: { not: id },
          },
        });

        if (existingUserByEmail) {
          throw new ConflictException(
            `Email ${updateUserDto.email} já está em uso`,
          );
        }
      }

      // Verificar se a nova role existe (se estiver sendo alterada)
      if (
        updateUserDto.role_id &&
        updateUserDto.role_id !== existingUser.role_id
      ) {
        const role = await this.prisma.role.findUnique({
          where: { id: updateUserDto.role_id },
        });

        if (!role) {
          throw new NotFoundException(
            `Role com ID ${updateUserDto.role_id} não encontrada`,
          );
        }
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          ...updateUserDto,
          updated_at: new Date(),
        },
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

      // Log das mudanças
      const changes = [];
      if (updateUserDto.name && updateUserDto.name !== existingUser.name) {
        changes.push(`Nome: ${existingUser.name} → ${updateUserDto.name}`);
      }
      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        changes.push(`Email: ${existingUser.email} → ${updateUserDto.email}`);
      }
      if (
        updateUserDto.role_id &&
        updateUserDto.role_id !== existingUser.role_id
      ) {
        changes.push(
          `Role: ${existingUser.role.role} → ${updatedUser.role.role}`,
        );
      }
      if (
        updateUserDto.is_active !== undefined &&
        updateUserDto.is_active !== existingUser.is_active
      ) {
        changes.push(
          `Status: ${existingUser.is_active ? "Ativo" : "Inativo"} → ${updateUserDto.is_active ? "Ativo" : "Inativo"}`,
        );
      }

      await this.loggingUtils.logAction({
        action: "UPDATE_USER",
        response: `Usuário atualizado: ${changes.join(", ")}`,
        user_id: updatedBy,
        customer: "SISTEMA",
        item_name: updatedUser.name,
        context: "Users",
      });

      this.loggingUtils.logLocal(
        `Usuário atualizado: ${updatedUser.name} - Mudanças: ${changes.join(", ")}`,
        "Users",
      );

      return updatedUser;
    } catch (error) {
      await this.loggingUtils.logAction({
        action: "UPDATE_USER",
        response: `Erro: ${error.message}`,
        user_id: updatedBy,
        customer: "SISTEMA",
        item_name: id,
        context: "Users",
      });

      this.loggingUtils.logError(
        `Erro ao atualizar usuário: ${error.message}`,
        "Users",
      );
      throw error;
    }
  }

  async deleteUser(id: string, deletedBy?: string) {
    try {
      // Verificar se o usuário existe
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              Log: true,
              AtlassianLog: true,
            },
          },
        },
      });

      if (!existingUser) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
      }

      // Verificar se há logs associados
      if (existingUser._count.Log > 0 || existingUser._count.AtlassianLog > 0) {
        throw new ConflictException(
          `Não é possível excluir o usuário "${existingUser.name}" pois possui ${existingUser._count.Log + existingUser._count.AtlassianLog} log(s) associado(s)`,
        );
      }

      await this.prisma.user.delete({
        where: { id },
      });

      await this.loggingUtils.logAction({
        action: "DELETE_USER",
        response: "Usuário excluído com sucesso",
        user_id: deletedBy,
        customer: "SISTEMA",
        item_name: existingUser.name,
        context: "Users",
      });

      this.loggingUtils.logLocal(
        `Usuário excluído: ${existingUser.name} (${existingUser.email})`,
        "Users",
      );

      return { message: "Usuário excluído com sucesso" };
    } catch (error) {
      await this.loggingUtils.logAction({
        action: "DELETE_USER",
        response: `Erro: ${error.message}`,
        user_id: deletedBy,
        customer: "SISTEMA",
        item_name: id,
        context: "Users",
      });

      this.loggingUtils.logError(
        `Erro ao excluir usuário: ${error.message}`,
        "Users",
      );
      throw error;
    }
  }

  // ==================== GERENCIAMENTO DE STATUS ====================

  async toggleUserStatus(id: string, changedBy?: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
      }

      const newStatus = !user.is_active;

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          is_active: newStatus,
          updated_at: new Date(),
        },
        include: {
          role: true,
        },
      });

      const action = newStatus ? "ACTIVATE_USER" : "DEACTIVATE_USER";
      const response = `Usuário ${newStatus ? "ativado" : "desativado"} com sucesso`;

      await this.loggingUtils.logAction({
        action,
        response,
        user_id: changedBy,
        customer: "SISTEMA",
        item_name: updatedUser.name,
        context: "Users",
      });

      this.loggingUtils.logLocal(`${response}: ${updatedUser.name}`, "Users");

      return updatedUser;
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao alterar status do usuário: ${error.message}`,
        "Users",
      );
      throw error;
    }
  }

  // ==================== GERENCIAMENTO DE ROLES ====================

  async changeUserRole(id: string, newRoleId: string, changedBy?: string) {
    try {
      const [user, newRole] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id },
          include: { role: true },
        }),
        this.prisma.role.findUnique({
          where: { id: newRoleId },
        }),
      ]);

      if (!user) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
      }

      if (!newRole) {
        throw new NotFoundException(`Role com ID ${newRoleId} não encontrada`);
      }

      if (user.role_id === newRoleId) {
        throw new BadRequestException(
          `Usuário já possui a role ${newRole.role}`,
        );
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          role_id: newRoleId,
          updated_at: new Date(),
        },
        include: {
          role: true,
        },
      });

      await this.loggingUtils.logAction({
        action: "CHANGE_USER_ROLE",
        response: `Role alterada de ${user.role.role} para ${newRole.role}`,
        user_id: changedBy,
        customer: "SISTEMA",
        item_name: updatedUser.name,
        context: "Users",
      });

      this.loggingUtils.logLocal(
        `Role alterada: ${updatedUser.name} - ${user.role.role} → ${newRole.role}`,
        "Users",
      );

      return updatedUser;
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao alterar role do usuário: ${error.message}`,
        "Users",
      );
      throw error;
    }
  }

  // ==================== LOGS DO USUÁRIO ====================

  async getUserLogs(
    id: string,
    options: {
      type?: "all" | "system" | "atlassian";
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      action?: string;
    } = {},
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
      }

      const dateFilter: any = {};
      if (options.startDate || options.endDate) {
        if (options.startDate) dateFilter.gte = options.startDate;
        if (options.endDate) dateFilter.lte = options.endDate;
      }

      const actionFilter = options.action
        ? { contains: options.action, mode: "insensitive" as const }
        : undefined;

      let systemLogs = [];
      let atlassianLogs = [];

      if (
        options.type === "all" ||
        options.type === "system" ||
        !options.type
      ) {
        systemLogs = await this.prisma.log.findMany({
          where: {
            user_id: id,
            ...(Object.keys(dateFilter).length > 0 && {
              created_at: dateFilter,
            }),
            ...(actionFilter && { action: actionFilter }),
          },
          orderBy: { created_at: "desc" },
          take: options.limit || 50,
          skip: options.offset || 0,
        });
      }

      if (
        options.type === "all" ||
        options.type === "atlassian" ||
        !options.type
      ) {
        atlassianLogs = await this.prisma.atlassianLog.findMany({
          where: {
            user_id: id,
            ...(Object.keys(dateFilter).length > 0 && {
              created_at: dateFilter,
            }),
            ...(actionFilter && { action: actionFilter }),
          },
          include: {
            group: {
              select: {
                group_name: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
          take: options.limit || 50,
          skip: options.offset || 0,
        });
      }

      // Combinar e ordenar logs por data
      const allLogs = [
        ...systemLogs.map((log) => ({ ...log, type: "system" })),
        ...atlassianLogs.map((log) => ({ ...log, type: "atlassian" })),
      ].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      const total = await Promise.all([
        options.type === "all" || options.type === "system" || !options.type
          ? this.prisma.log.count({ where: { user_id: id } })
          : 0,
        options.type === "all" || options.type === "atlassian" || !options.type
          ? this.prisma.atlassianLog.count({ where: { user_id: id } })
          : 0,
      ]);

      return {
        user,
        logs: allLogs.slice(0, options.limit || 50),
        stats: {
          systemLogs: total[0],
          atlassianLogs: total[1],
          totalLogs: total[0] + total[1],
        },
        pagination: {
          total: total[0] + total[1],
          limit: options.limit || 50,
          offset: options.offset || 0,
          hasMore: (options.offset || 0) + allLogs.length < total[0] + total[1],
        },
      };
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao buscar logs do usuário: ${error.message}`,
        "Users",
      );
      throw error;
    }
  }

  // ==================== ESTATÍSTICAS ====================

  async getUserStats(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, created_at: true, last_login: true },
      });

      if (!user) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalSystemLogs,
        totalAtlassianLogs,
        recentSystemLogs,
        recentAtlassianLogs,
        weeklySystemLogs,
        weeklyAtlassianLogs,
        topActions,
      ] = await Promise.all([
        this.prisma.log.count({ where: { user_id: id } }),
        this.prisma.atlassianLog.count({ where: { user_id: id } }),
        this.prisma.log.count({
          where: {
            user_id: id,
            created_at: { gte: thirtyDaysAgo },
          },
        }),
        this.prisma.atlassianLog.count({
          where: {
            user_id: id,
            created_at: { gte: thirtyDaysAgo },
          },
        }),
        this.prisma.log.count({
          where: {
            user_id: id,
            created_at: { gte: sevenDaysAgo },
          },
        }),
        this.prisma.atlassianLog.count({
          where: {
            user_id: id,
            created_at: { gte: sevenDaysAgo },
          },
        }),
        this.prisma.log.groupBy({
          by: ["action"],
          where: { user_id: id },
          _count: { action: true },
          orderBy: { _count: { action: "desc" } },
          take: 5,
        }),
      ]);

      return {
        user,
        totalLogs: totalSystemLogs + totalAtlassianLogs,
        systemLogs: {
          total: totalSystemLogs,
          last30Days: recentSystemLogs,
          last7Days: weeklySystemLogs,
        },
        atlassianLogs: {
          total: totalAtlassianLogs,
          last30Days: recentAtlassianLogs,
          last7Days: weeklyAtlassianLogs,
        },
        topActions: topActions.map((action) => ({
          action: action.action,
          count: action._count.action,
        })),
        accountAge: Math.floor(
          (now.getTime() - user.created_at.getTime()) / (1000 * 60 * 60 * 24),
        ),
        lastLoginDaysAgo: user.last_login
          ? Math.floor(
              (now.getTime() - user.last_login.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null,
      };
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao buscar estatísticas do usuário: ${error.message}`,
        "Users",
      );
      throw error;
    }
  }

  async getSystemStats() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        activeUsers,
        recentUsers,
        usersByRole,
        activeUsersLast30Days,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { is_active: true } }),
        this.prisma.user.count({
          where: { created_at: { gte: thirtyDaysAgo } },
        }),
        this.prisma.user.groupBy({
          by: ["role_id"],
          _count: { role_id: true },
          orderBy: { _count: { role_id: "desc" } },
        }),
        this.prisma.user.count({
          where: {
            is_active: true,
            last_login: { gte: thirtyDaysAgo },
          },
        }),
      ]);

      // Buscar nomes das roles
      const roleIds = usersByRole.map((role) => role.role_id);
      const roles = await this.prisma.role.findMany({
        where: { id: { in: roleIds } },
        select: { id: true, role: true },
      });

      const rolesMap = roles.reduce(
        (acc, role) => {
          acc[role.id] = role.role;
          return acc;
        },
        {} as Record<string, string>,
      );

      return {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        recentUsers,
        activeUsersLast30Days,
        usersByRole: usersByRole.map((role) => ({
          role: rolesMap[role.role_id] || "Unknown",
          count: role._count.role_id,
        })),
        activityRate:
          totalUsers > 0 ? (activeUsersLast30Days / totalUsers) * 100 : 0,
      };
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao buscar estatísticas do sistema: ${error.message}`,
        "Users",
      );
      return {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        recentUsers: 0,
        activeUsersLast30Days: 0,
        usersByRole: [],
        activityRate: 0,
      };
    }
  }

  // ==================== UTILITÁRIOS ====================

  async updateLastLogin(id: string) {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { last_login: new Date() },
      });

      this.loggingUtils.logLocal(
        `Last login atualizado para usuário ID: ${id}`,
        "Users",
      );
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao atualizar last login: ${error.message}`,
        "Users",
      );
    }
  }

  async getUsersByRole(roleId: string) {
    try {
      const users = await this.prisma.user.findMany({
        where: { role_id: roleId },
        include: {
          role: true,
          _count: {
            select: {
              Log: true,
              AtlassianLog: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return users;
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao buscar usuários por role: ${error.message}`,
        "Users",
      );
      return [];
    }
  }
}
