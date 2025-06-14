import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { PrismaService } from "common/services/prisma.service";
import { LoggingUtils } from "common/utils/logging.utils";
import {
  CreateGroupDto,
  UpdateGroupDto,
  GroupFilters,
  LicenseUsageData,
  InviteUserDto,
  ValidationResponse,
} from "./interfaces/atlassian.interfaces";

@Injectable()
export class AtlassianService {
  private readonly atlassianApiUrl: string;
  private readonly atlassianUsername: string;
  private readonly atlassianApiToken: string;
  private readonly authHeaders: Record<string, string>;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly loggingUtils: LoggingUtils,
  ) {
    // ✅ Configurar credenciais do Atlassian a partir do .env
    this.atlassianApiUrl = this.configService.get<string>("ATLASSIAN_API_URL");
    this.atlassianUsername =
      this.configService.get<string>("ATLASSIAN_USERNAME");
    this.atlassianApiToken = this.configService.get<string>(
      "ATLASSIAN_API_TOKEN",
    );

    if (
      !this.atlassianApiUrl ||
      !this.atlassianUsername ||
      !this.atlassianApiToken
    ) {
      throw new Error("Configurações do Atlassian não encontradas no .env");
    }

    // ✅ Configurar headers de autenticação
    const credentials = Buffer.from(
      `${this.atlassianUsername}:${this.atlassianApiToken}`,
    ).toString("base64");

    this.authHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${credentials}`,
    };
  }

  // ==================== MÉTODOS DE LICENÇAS ====================

  /**
   * ✅ Consulta o uso aproximado de licenças para um produto específico
   */
  async getApproximateLicenseCount(
    product: string = "jira-servicedesk",
  ): Promise<LicenseUsageData> {
    try {
      const url = `${this.atlassianApiUrl}/3/license/approximateLicenseCount/product/${product}`;
      console.log(
        `Consultando licenças do Atlassian para ${product} em: ${url}`,
      );

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.authHeaders,
        }),
      );

      if (!response.data || typeof response.data.value === "undefined") {
        throw new HttpException(
          "Resposta inválida da API do Atlassian",
          HttpStatus.BAD_GATEWAY,
        );
      }

      const licenseData: LicenseUsageData = {
        product,
        currentUsage: parseInt(response.data.value),
        approximateCount: parseInt(response.data.value),
        timestamp: new Date(),
      };

      return licenseData;
    } catch (error) {
      // ✅ Log apenas erros importantes
      this.loggingUtils.logError(
        `Erro ao consultar licenças do Atlassian para ${product}: ${error.message}`,
        "AtlassianService",
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Erro ao consultar licenças do Atlassian: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ Consulta detalhada de licenças para múltiplos produtos
   */
  async getDetailedLicenseUsage(): Promise<LicenseUsageData[]> {
    const products = ["jira-servicedesk", "jira-software", "confluence"];

    const licensePromises = products.map((product) =>
      this.getApproximateLicenseCount(product).catch((error) => {
        console.warn(
          `Erro ao consultar licenças para ${product}:`,
          error.message,
        );
        return {
          product,
          currentUsage: 0,
          approximateCount: 0,
          timestamp: new Date(),
          error: error.message,
        };
      }),
    );

    const results = await Promise.all(licensePromises);
    return results;
  }

  /**
   * ✅ Busca informações de usuários no Atlassian
   */
  async searchAtlassianUser(emailOrUsername: string): Promise<any> {
    try {
      const url = `${this.atlassianApiUrl}/3/user/search?query=${encodeURIComponent(emailOrUsername)}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.authHeaders,
        }),
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        `Erro ao buscar usuário no Atlassian: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ Convidar usuário para o Atlassian
   */
  async inviteUser(email: string): Promise<any> {
    try {
      const url = `${this.atlassianApiUrl}/3/user`;

      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            emailAddress: email,
            products: [],
          },
          {
            headers: this.authHeaders,
          },
        ),
      );

      // ✅ Log apenas ações importantes como convites
      this.loggingUtils.logAtlassianAction(
        "USER_INVITE",
        `Convite enviado para ${email}`,
        { email },
      );

      return response.data;
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao convidar usuário ${email}: ${error.message}`,
        "AtlassianService",
      );

      throw new HttpException(
        `Erro ao convidar usuário: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== MÉTODOS DE GRUPOS (EXISTENTES) ====================

  async createGroup(createGroupDto: CreateGroupDto, userId: string) {
    try {
      // Verificar se o group_id já existe
      const existingGroup = await this.prisma.atlassianGroup.findUnique({
        where: { group_id: createGroupDto.group_id },
      });

      if (existingGroup) {
        throw new HttpException(
          "ID do grupo já existe no Atlassian",
          HttpStatus.CONFLICT,
        );
      }

      // Verificar se o nome já existe
      const existingName = await this.prisma.atlassianGroup.findFirst({
        where: { group_name: createGroupDto.group_name },
      });

      if (existingName) {
        throw new HttpException("Nome do grupo já existe", HttpStatus.CONFLICT);
      }

      const group = await this.prisma.atlassianGroup.create({
        data: {
          group_id: createGroupDto.group_id,
          group_name: createGroupDto.group_name,
          description: createGroupDto.description,
          order: createGroupDto.order,
          created_by: userId,
          updated_by: userId,
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          updater: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Log da atividade
      this.loggingUtils.logAtlassianAction(
        "CREATE_GROUP",
        `Grupo "${createGroupDto.group_name}" criado`,
        createGroupDto,
      );

      return group;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Erro interno do servidor",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllGroups(filters: GroupFilters) {
    try {
      const where: any = {};

      // Filtro de status ativo
      if (filters.isActive !== undefined) {
        where.is_active = filters.isActive;
      }

      // Filtro de busca
      if (filters.search) {
        where.OR = [
          { group_name: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      // Configurar ordenação
      const orderBy: any = {};
      orderBy[filters.orderBy] = filters.orderDirection;

      const [groups, total] = await Promise.all([
        this.prisma.atlassianGroup.findMany({
          where,
          orderBy,
          skip: filters.offset,
          take: filters.limit,
          include: {
            creator: {
              select: { id: true, name: true, email: true },
            },
            updater: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
        this.prisma.atlassianGroup.count({ where }),
      ]);

      return {
        data: groups,
        pagination: {
          total,
          limit: filters.limit,
          offset: filters.offset,
          hasMore: filters.offset + filters.limit < total,
        },
      };
    } catch (error) {
      throw new HttpException(
        "Erro ao buscar grupos",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getGroupById(id: string) {
    try {
      const group = await this.prisma.atlassianGroup.findUnique({
        where: { id },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          updater: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!group) {
        throw new HttpException("Grupo não encontrado", HttpStatus.NOT_FOUND);
      }

      return group;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Erro interno do servidor",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateGroup(
    id: string,
    updateGroupDto: UpdateGroupDto,
    userId: string,
  ) {
    try {
      // Verificar se o grupo existe
      const existingGroup = await this.prisma.atlassianGroup.findUnique({
        where: { id },
      });

      if (!existingGroup) {
        throw new HttpException("Grupo não encontrado", HttpStatus.NOT_FOUND);
      }

      // Se está alterando o nome, verificar se já existe
      if (
        updateGroupDto.group_name &&
        updateGroupDto.group_name !== existingGroup.group_name
      ) {
        const nameExists = await this.prisma.atlassianGroup.findFirst({
          where: {
            group_name: updateGroupDto.group_name,
            id: { not: id },
          },
        });

        if (nameExists) {
          throw new HttpException(
            "Nome do grupo já existe",
            HttpStatus.CONFLICT,
          );
        }
      }

      const updatedGroup = await this.prisma.atlassianGroup.update({
        where: { id },
        data: {
          group_name: updateGroupDto.group_name,
          description: updateGroupDto.description,
          order: updateGroupDto.order,
          is_active: updateGroupDto.is_active,
          updated_by: userId,
          updated_at: new Date(),
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          updater: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Log da atividade
      this.loggingUtils.logAtlassianAction(
        "UPDATE_GROUP",
        `Grupo "${existingGroup.group_name}" atualizado`,
        { before: existingGroup.group_name, after: updateGroupDto.group_name },
      );

      return updatedGroup;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Erro interno do servidor",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteGroup(id: string, userId: string) {
    try {
      const existingGroup = await this.prisma.atlassianGroup.findUnique({
        where: { id },
      });

      if (!existingGroup) {
        throw new HttpException("Grupo não encontrado", HttpStatus.NOT_FOUND);
      }

      await this.prisma.atlassianGroup.delete({
        where: { id },
      });

      // Log da atividade
      this.loggingUtils.logAtlassianAction(
        "DELETE_GROUP",
        `Grupo "${existingGroup.group_name}" removido`,
        { groupId: id, groupName: existingGroup.group_name },
      );

      return {
        message: `Grupo "${existingGroup.group_name}" removido com sucesso`,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Erro interno do servidor",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async seedInitialGroups(userId: string) {
    const initialGroups = [
      {
        group_id: "db32e550-152b-4ce2-abbf-b4bd98a6844a",
        group_name: "Públicos",
        description: "em desenvolvimento",
        order: 1,
      },
      {
        group_id: "9cdfaec0-4bdb-4b75-ac9a-1189efcb6993",
        group_name: "Aprovadores",
        description: "em desenvolvimento",
        order: 2,
      },
      // ... outros grupos iniciais
    ];

    const createdGroups = [];

    for (const groupData of initialGroups) {
      try {
        const existingGroup = await this.prisma.atlassianGroup.findUnique({
          where: { group_id: groupData.group_id },
        });

        if (!existingGroup) {
          const newGroup = await this.prisma.atlassianGroup.create({
            data: {
              ...groupData,
              created_by: userId,
              updated_by: userId,
            },
          });
          createdGroups.push(newGroup);
        }
      } catch (error) {
        console.warn(`Erro ao criar grupo ${groupData.group_name}:`, error);
      }
    }

    return createdGroups;
  }

  async validateGroupName(
    name: string,
    excludeId?: string,
  ): Promise<ValidationResponse> {
    const where: any = { group_name: name };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existing = await this.prisma.atlassianGroup.findFirst({ where });

    return {
      isValid: !existing,
      exists: !!existing,
    };
  }

  async validateAtlassianId(
    groupId: string,
    excludeId?: string,
  ): Promise<ValidationResponse> {
    const where: any = { group_id: groupId };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existing = await this.prisma.atlassianGroup.findFirst({ where });

    return {
      isValid: !existing,
      exists: !!existing,
    };
  }
}
