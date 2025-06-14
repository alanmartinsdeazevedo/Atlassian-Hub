import { Injectable } from "@nestjs/common";
import { PrismaService } from "../services/prisma.service";

interface LogParams {
  user_id?: string;
  customer?: string;
  item_name?: string;
  action: string;
  response: string;
  ip_address?: string;
}

interface OnboardingLogParams {
  issue_key: string;
  issue_id: number;
  fullName: string;
  user_name: string;
  email: string;
  password: string;
  description: string;
  department: string;
  organizational_unit: string;
  city: string;
  state: string;
  country: string;
  status: string;
  error_message?: string;
}

@Injectable()
export class LoggingUtils {
  constructor(private prisma: PrismaService) {}

  // ==================== LOG GERAL DA APLICAÇÃO ====================

  async logDB(log: LogParams) {
    try {
      await this.prisma.log.create({
        data: {
          user_id: log.user_id,
          customer: log.customer || "SISTEMA",
          item_name: log.item_name || "",
          action: log.action,
          response: log.response,
          ip_address: log.ip_address || "0.0.0.0",
        },
      });
    } catch (err) {
      console.error("Erro ao registrar no banco de dados:", err);
    }
  }

  // ==================== LOG ESPECÍFICO PARA ONBOARDING ====================

  async logOnboarding(log: OnboardingLogParams) {
    try {
      await this.prisma.onboarding.create({
        data: {
          issue_key: log.issue_key,
          issue_id: log.issue_id,
          full_name: log.fullName,
          user_name: log.user_name,
          email: log.email,
          password: log.password,
          description: log.description,
          department: log.department,
          organizational_unit: log.organizational_unit,
          city: log.city,
          state: log.state,
          country: log.country,
          status: log.status,
          error_message: log.error_message,
        },
      });
    } catch (err) {
      console.error("Erro ao registrar onboarding no banco de dados:", err);
    }
  }

  // ==================== LOGS DE CONSOLE ====================

  logError(message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : "";
    console.error(`[ERROR] ${timestamp}${contextStr} ${message}`);
  }

  logLocal(message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : "";
    console.log(`[INFO] ${timestamp}${contextStr} ${message}`);
  }

  logWarn(message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : "";
    console.warn(`[WARN] ${timestamp}${contextStr} ${message}`);
  }

  logDebug(message: string, context?: string) {
    if (process.env.NODE_ENV === "development") {
      const timestamp = new Date().toISOString();
      const contextStr = context ? ` [${context}]` : "";
      console.debug(`[DEBUG] ${timestamp}${contextStr} ${message}`);
    }
  }

  // ==================== LOG COMPLETO COM BANCO E CONSOLE ====================

  async logAction(params: {
    action: string;
    response: string;
    user_id?: string;
    customer?: string;
    item_name?: string;
    ip_address?: string;
    context?: string;
    logToConsole?: boolean;
  }) {
    try {
      // Log no banco de dados
      await this.logDB({
        user_id: params.user_id,
        customer: params.customer,
        item_name: params.item_name,
        action: params.action,
        response: params.response,
        ip_address: params.ip_address,
      });

      // Log no console (opcional)
      if (params.logToConsole !== false) {
        const message = `${params.action} - ${params.response}`;
        if (
          params.response.toLowerCase().includes("erro") ||
          params.response.toLowerCase().includes("falha")
        ) {
          this.logError(message, params.context);
        } else {
          this.logLocal(message, params.context);
        }
      }
    } catch (error) {
      this.logError(
        `Falha ao registrar ação: ${error.message}`,
        "LoggingUtils",
      );
    }
  }

  // ==================== UTILITÁRIOS DE LOG ====================

  async getRecentLogs(
    options: {
      limit?: number;
      user_id?: string;
      action?: string;
      customer?: string;
      hours?: number;
    } = {},
  ) {
    try {
      const where: any = {};

      if (options.user_id) where.user_id = options.user_id;
      if (options.action)
        where.action = { contains: options.action, mode: "insensitive" };
      if (options.customer) where.customer = options.customer;

      if (options.hours) {
        const hoursAgo = new Date();
        hoursAgo.setHours(hoursAgo.getHours() - options.hours);
        where.created_at = { gte: hoursAgo };
      }

      const logs = await this.prisma.log.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
        take: options.limit || 50,
      });

      return logs;
    } catch (error) {
      this.logError(
        `Erro ao buscar logs recentes: ${error.message}`,
        "LoggingUtils",
      );
      return [];
    }
  }

  async getLogStats(
    options: {
      user_id?: string;
      hours?: number;
    } = {},
  ) {
    try {
      const where: any = {};

      if (options.user_id) where.user_id = options.user_id;

      if (options.hours) {
        const hoursAgo = new Date();
        hoursAgo.setHours(hoursAgo.getHours() - options.hours);
        where.created_at = { gte: hoursAgo };
      }

      const [totalLogs, actionStats] = await Promise.all([
        this.prisma.log.count({ where }),
        this.prisma.log.groupBy({
          by: ["action"],
          where,
          _count: {
            action: true,
          },
          orderBy: {
            _count: {
              action: "desc",
            },
          },
          take: 10,
        }),
      ]);

      return {
        total: totalLogs,
        topActions: actionStats.map((stat) => ({
          action: stat.action,
          count: stat._count.action,
        })),
      };
    } catch (error) {
      this.logError(
        `Erro ao buscar estatísticas de logs: ${error.message}`,
        "LoggingUtils",
      );
      return {
        total: 0,
        topActions: [],
      };
    }
  }

  // ==================== HELPERS PARA CONTEXTOS ESPECÍFICOS ====================

  logAtlassianAction(action: string, result: string, details?: any) {
    this.logAction({
      action: `ATLASSIAN_${action}`,
      response: result,
      customer: "ATLASSIAN",
      item_name: details?.groupName || details?.email || "",
      context: "Atlassian",
    });
  }

  logAdAction(action: string, result: string, username?: string) {
    this.logAction({
      action: `AD_${action}`,
      response: result,
      customer: "ACTIVE_DIRECTORY",
      item_name: username || "",
      context: "ActiveDirectory",
    });
  }

  logCentralAction(action: string, result: string, cpfcnpj?: string) {
    this.logAction({
      action: `CENTRAL_${action}`,
      response: result,
      customer: "CENTRAL",
      item_name: cpfcnpj || "",
      context: "Central",
    });
  }

  // ==================== FORMATADORES ====================

  formatLogMessage(
    action: string,
    status: "SUCCESS" | "ERROR" | "WARNING",
    details?: any,
  ): string {
    const timestamp = new Date().toISOString();
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
    return `[${timestamp}] ${action} - ${status}${detailsStr}`;
  }

  sanitizeString(input: string): string {
    if (!input) return "";
    return input.replace(/\u0000/g, "").substring(0, 500); // Limitar tamanho e remover caracteres nulos
  }
}
