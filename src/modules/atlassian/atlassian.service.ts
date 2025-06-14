import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "common/services/prisma.service";
import { LoggingUtils } from "common/utils/logging.utils";

interface CreateGroupDto {
  group_id: string;
  group_name: string;
  description?: string;
  order?: number;
}

interface UpdateGroupDto {
  group_name?: string;
  description?: string;
  order?: number;
  is_active?: boolean;
}

@Injectable()
export class AtlassianService {
  constructor(
    private prisma: PrismaService,
    private loggingUtils: LoggingUtils,
  ) {}

  // ==================== CRUD DOS GRUPOS ====================

  async createGroup(createGroupDto: CreateGroupDto, userId?: string) {
    try {
      // Verificar se já existe um grupo com o mesmo group_id
      const existingGroup = await this.prisma.atlassianGroup.findUnique({
        where: { group_id: createGroupDto.group_id },
      });

      if (existingGroup) {
        throw new ConflictException(
          `Grupo com ID ${createGroupDto.group_id} já existe`,
        );
      }

      // Verificar se já existe um grupo com o mesmo nome
      const existingGroupByName = await this.prisma.atlassianGroup.findFirst({
        where: { group_name: createGroupDto.group_name },
      });

      if (existingGroupByName) {
        throw new ConflictException(
          `Grupo com nome "${createGroupDto.group_name}" já existe`,
        );
      }

      const group = await this.prisma.atlassianGroup.create({
        data: {
          group_id: createGroupDto.group_id,
          group_name: createGroupDto.group_name,
          description: createGroupDto.description,
          order: createGroupDto.order,
        },
      });

      this.loggingUtils.logLocal(
        `Grupo criado: ${group.group_name} (ID: ${group.group_id})`,
      );

      return group;
    } catch (error) {
      this.loggingUtils.logError(`Erro ao criar grupo: ${error.message}`);
      throw error;
    }
  }

  async getAllGroups(filters?: {
    isActive?: boolean;
    search?: string;
    orderBy?: "order" | "name" | "created_at";
    orderDirection?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }) {
    try {
      const where: any = {};

      if (filters?.isActive !== undefined) {
        where.is_active = filters.isActive;
      }

      if (filters?.search) {
        where.OR = [
          { group_name: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      const orderBy: any = {};
      if (filters?.orderBy) {
        orderBy[filters.orderBy === "name" ? "group_name" : filters.orderBy] =
          filters.orderDirection || "asc";
      } else {
        orderBy.order = "asc";
      }

      const [groups, total] = await Promise.all([
        this.prisma.atlassianGroup.findMany({
          where,
          orderBy,
          take: filters?.limit || 50,
          skip: filters?.offset || 0,
        }),
        this.prisma.atlassianGroup.count({ where }),
      ]);

      return {
        groups,
        pagination: {
          total,
          limit: filters?.limit || 50,
          offset: filters?.offset || 0,
          hasMore: (filters?.offset || 0) + groups.length < total,
        },
      };
    } catch (error) {
      this.loggingUtils.logError(`Erro ao buscar grupos: ${error.message}`);
      return {
        groups: [],
        pagination: {
          total: 0,
          limit: 0,
          offset: 0,
          hasMore: false,
        },
      };
    }
  }

  async getGroupById(id: string) {
    try {
      const group = await this.prisma.atlassianGroup.findUnique({
        where: { id },
      });

      if (!group) {
        throw new NotFoundException(`Grupo com ID ${id} não encontrado`);
      }

      return group;
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao buscar grupo por ID: ${error.message}`,
      );
      throw error;
    }
  }

  async getGroupByAtlassianId(groupId: string) {
    try {
      const group = await this.prisma.atlassianGroup.findUnique({
        where: { group_id: groupId },
      });

      if (!group) {
        throw new NotFoundException(
          `Grupo com group_id ${groupId} não encontrado`,
        );
      }

      return group;
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao buscar grupo por Atlassian ID: ${error.message}`,
      );
      throw error;
    }
  }

  async updateGroup(
    id: string,
    updateGroupDto: UpdateGroupDto,
    userId?: string,
  ) {
    try {
      // Verificar se o grupo existe
      const existingGroup = await this.prisma.atlassianGroup.findUnique({
        where: { id },
      });

      if (!existingGroup) {
        throw new NotFoundException(`Grupo com ID ${id} não encontrado`);
      }

      // Verificar se o novo nome não está em uso (se estiver sendo alterado)
      if (
        updateGroupDto.group_name &&
        updateGroupDto.group_name !== existingGroup.group_name
      ) {
        const existingGroupByName = await this.prisma.atlassianGroup.findFirst({
          where: {
            group_name: updateGroupDto.group_name,
            id: { not: id },
          },
        });

        if (existingGroupByName) {
          throw new ConflictException(
            `Grupo com nome "${updateGroupDto.group_name}" já existe`,
          );
        }
      }

      const updatedGroup = await this.prisma.atlassianGroup.update({
        where: { id },
        data: {
          ...updateGroupDto,
          updated_at: new Date(),
        },
      });

      this.loggingUtils.logLocal(
        `Grupo atualizado: ${updatedGroup.group_name} (ID: ${updatedGroup.group_id})`,
      );

      return updatedGroup;
    } catch (error) {
      this.loggingUtils.logError(`Erro ao atualizar grupo: ${error.message}`);
      throw error;
    }
  }

  async deleteGroup(id: string, userId?: string) {
    try {
      // Verificar se o grupo existe
      const existingGroup = await this.prisma.atlassianGroup.findUnique({
        where: { id },
      });

      if (!existingGroup) {
        throw new NotFoundException(`Grupo com ID ${id} não encontrado`);
      }

      await this.prisma.atlassianGroup.delete({
        where: { id },
      });

      this.loggingUtils.logLocal(
        `Grupo excluído: ${existingGroup.group_name} (ID: ${existingGroup.group_id})`,
      );

      return { message: "Grupo excluído com sucesso" };
    } catch (error) {
      this.loggingUtils.logError(`Erro ao excluir grupo: ${error.message}`);
      throw error;
    }
  }

  // ==================== SEED DOS GRUPOS HARDCODED ====================

  async seedInitialGroups(userId?: string) {
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
      {
        group_id: "6043a622-a670-4dc5-abef-60c6d9340976",
        group_name: "BS",
        description: "em desenvolvimento",
        order: 3,
      },
      {
        group_id: "aac2baad-453f-484c-8bef-3fa10d6b4970",
        group_name: "CONT",
        description: "em desenvolvimento",
        order: 4,
      },
      {
        group_id: "cf56d3f2-362c-4648-afc9-6fe9edf162f9",
        group_name: "DE",
        description: "em desenvolvimento",
        order: 5,
      },
      {
        group_id: "3d517ec3-9e59-458d-912d-1ce49e7fcba5",
        group_name: "ENGT",
        description: "em desenvolvimento",
        order: 6,
      },
      {
        group_id: "be0af1c1-0dac-49ac-8991-c4cf6bc33f63",
        group_name: "FAC",
        description: "em desenvolvimento",
        order: 7,
      },
      {
        group_id: "060c2d66-f5eb-429a-94eb-cf19448a11ea",
        group_name: "FEF",
        description: "em desenvolvimento",
        order: 8,
      },
      {
        group_id: "949d710e-a9af-4bf4-adb6-98bfff14e097",
        group_name: "FIN",
        description: "em desenvolvimento",
        order: 9,
      },
      {
        group_id: "f9a853f3-8e3a-44be-ae4e-7b316b9e0239",
        group_name: "GDD",
        description: "em desenvolvimento",
        order: 10,
      },
      {
        group_id: "da05199e-d62c-4342-9b9b-9e497f860ad2",
        group_name: "GMUD",
        description: "em desenvolvimento",
        order: 11,
      },
      {
        group_id: "cf86d3cf-fdf3-4a00-a769-3e7d40000610",
        group_name: "GMUDT",
        description: "em desenvolvimento",
        order: 12,
      },
      {
        group_id: "55383512-5870-4c97-b0a0-4bc7b1a334a7",
        group_name: "GSOP",
        description: "em desenvolvimento",
        order: 13,
      },
      {
        group_id: "5eef44e5-533e-452d-8afd-9ab8d7a0a207",
        group_name: "GSTI",
        description: "em desenvolvimento",
        order: 14,
      },
      {
        group_id: "e14a1076-e7b7-440a-8114-1f478167bc98",
        group_name: "MEEF",
        description: "em desenvolvimento",
        order: 15,
      },
      {
        group_id: "b6b03ceb-0029-4849-b6b6-3d934d21c88c",
        group_name: "RUIET",
        description: "em desenvolvimento",
        order: 16,
      },
      {
        group_id: "aa826844-690a-4a34-b47c-0d6b110d9c52",
        group_name: "RUIET Resolvedor",
        description: "em desenvolvimento",
        order: 17,
      },
      {
        group_id: "16c83fec-ab80-4fba-8053-8cab7e84270c",
        group_name: "RHB Resolvedor",
        description: "em desenvolvimento",
        order: 18,
      },
      {
        group_id: "69b4239b-7473-4cec-97b8-f6469fce5f51",
        group_name: "RHS Resolvedor",
        description: "em desenvolvimento",
        order: 19,
      },
      {
        group_id: "499d0950-349e-4a24-8c62-c59944377554",
        group_name: "BS Resolvedor",
        description: "em desenvolvimento",
        order: 20,
      },
      {
        group_id: "828ff6f4-cf8a-4a67-b879-77d21e6e96bb",
        group_name: "ENGT Resolvedor",
        description: "em desenvolvimento",
        order: 21,
      },
      {
        group_id: "c8f09917-c983-4ee4-89c1-017eab4cdc20",
        group_name: "FAC Resolvedor",
        description: "em desenvolvimento",
        order: 22,
      },
      {
        group_id: "3dfc3e70-af6f-4997-9a2b-3322daaa55f2",
        group_name: "FEF Resolvedor",
        description: "em desenvolvimento",
        order: 23,
      },
      {
        group_id: "190befbf-2b30-4b12-b401-73669acc1be9",
        group_name: "FIN Resolvedor",
        description: "em desenvolvimento",
        order: 24,
      },
      {
        group_id: "9bf6cb3b-0b0f-42dd-a738-2f82079d31e7",
        group_name: "GSTI Resolvedor",
        description: "em desenvolvimento",
        order: 25,
      },
      {
        group_id: "513fcad8-b73f-4709-b202-d8436ff21c58",
        group_name: "GSTI RH",
        description: "em desenvolvimento",
        order: 26,
      },
      {
        group_id: "c5b88a13-0f89-4827-a982-fcc5dceae5d4",
        group_name: "GMUDT Resolvedor",
        description: "em desenvolvimento",
        order: 27,
      },
      {
        group_id: "9b2f59e2-3155-4b0b-b1eb-a7c559cc8144",
        group_name: "GSOP Resolvedor",
        description: "em desenvolvimento",
        order: 28,
      },
    ];

    const results = {
      created: 0,
      skipped: 0,
      errors: 0,
    };

    for (const groupData of initialGroups) {
      try {
        const existingGroup = await this.prisma.atlassianGroup.findUnique({
          where: { group_id: groupData.group_id },
        });

        if (!existingGroup) {
          await this.createGroup(groupData, userId);
          results.created++;
        } else {
          results.skipped++;
        }
      } catch (error) {
        this.loggingUtils.logError(
          `Erro ao criar grupo ${groupData.group_name}: ${error.message}`,
        );
        results.errors++;
      }
    }

    this.loggingUtils.logLocal(
      `Seed concluído - Criados: ${results.created}, Ignorados: ${results.skipped}, Erros: ${results.errors}`,
    );

    return results;
  }

  // ==================== UTILITÁRIOS ====================

  async getGroupsForSelect(activeOnly: boolean = true) {
    try {
      const filters = {
        isActive: activeOnly,
        orderBy: "order" as const,
        orderDirection: "asc" as const,
        limit: 100,
      };

      const result = await this.getAllGroups(filters);

      // Formatação compatível com o frontend
      const formattedGroups = result.groups.map((group, index) => ({
        id: (index + 1).toString(),
        groupId: group.group_id,
        groupName: group.group_name,
        description: group.description,
        order: group.order || index + 1,
        createdAt: group.created_at.toISOString(),
      }));

      return formattedGroups;
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao buscar grupos para seleção: ${error.message}`,
      );
      return [];
    }
  }

  async validateGroupName(name: string, excludeId?: string) {
    try {
      const where: any = {
        group_name: { equals: name, mode: "insensitive" },
      };

      if (excludeId) {
        where.id = { not: excludeId };
      }

      const existingGroup = await this.prisma.atlassianGroup.findFirst({
        where,
      });

      return {
        available: !existingGroup,
        message: existingGroup ? "Nome já está em uso" : "Nome disponível",
      };
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao validar nome do grupo: ${error.message}`,
      );
      return {
        available: false,
        message: "Erro ao validar nome",
      };
    }
  }

  async validateAtlassianId(groupId: string, excludeId?: string) {
    try {
      const where: any = { group_id: groupId };

      if (excludeId) {
        where.id = { not: excludeId };
      }

      const existingGroup = await this.prisma.atlassianGroup.findFirst({
        where,
      });

      return {
        available: !existingGroup,
        message: existingGroup
          ? "Group ID já está em uso"
          : "Group ID disponível",
      };
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao validar Atlassian ID: ${error.message}`,
      );
      return {
        available: false,
        message: "Erro ao validar Group ID",
      };
    }
  }

  async getGroupStats() {
    try {
      const [totalGroups, activeGroups] = await Promise.all([
        this.prisma.atlassianGroup.count(),
        this.prisma.atlassianGroup.count({ where: { is_active: true } }),
      ]);

      return {
        totalGroups,
        activeGroups,
        inactiveGroups: totalGroups - activeGroups,
      };
    } catch (error) {
      this.loggingUtils.logError(
        `Erro ao buscar estatísticas de grupos: ${error.message}`,
      );
      return {
        totalGroups: 0,
        activeGroups: 0,
        inactiveGroups: 0,
      };
    }
  }
}
