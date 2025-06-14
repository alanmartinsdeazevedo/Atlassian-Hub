import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { AtlassianService } from "./atlassian.service";

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

@Controller("atlassian")
export class AtlassianController {
  constructor(private readonly atlassianService: AtlassianService) {}

  // ==================== CRUD GRUPOS ====================

  @Post("groups")
  async createGroup(
    @Body() createGroupDto: CreateGroupDto,
    @Req() req: Request,
  ) {
    try {
      // TODO: Extrair userId do token de autenticação
      const userId = req.headers["user-id"] as string;

      if (!createGroupDto.group_id || !createGroupDto.group_name) {
        throw new HttpException(
          "group_id e group_name são obrigatórios",
          HttpStatus.BAD_REQUEST,
        );
      }

      const group = await this.atlassianService.createGroup(
        createGroupDto,
        userId,
      );

      return {
        success: true,
        message: "Grupo criado com sucesso",
        data: group,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("groups")
  async getAllGroups(
    @Query("isActive") isActive?: string,
    @Query("search") search?: string,
    @Query("orderBy") orderBy?: "order" | "name" | "created_at",
    @Query("orderDirection") orderDirection?: "asc" | "desc",
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    try {
      const filters = {
        isActive: isActive !== undefined ? isActive === "true" : undefined,
        search: search || undefined,
        orderBy: orderBy || "order",
        orderDirection: orderDirection || "asc",
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
      };

      const result = await this.atlassianService.getAllGroups(filters);

      return {
        success: true,
        message: "Grupos recuperados com sucesso",
        data: result.groups,
        pagination: result.pagination,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("groups/stats")
  async getGroupStats() {
    try {
      const stats = await this.atlassianService.getGroupStats();

      return {
        success: true,
        message: "Estatísticas recuperadas com sucesso",
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("groups/select")
  async getGroupsForSelect(@Query("activeOnly") activeOnly?: string) {
    try {
      const groups = await this.atlassianService.getGroupsForSelect(
        activeOnly !== "false",
      );

      return {
        success: true,
        message: "Lista de grupos para seleção",
        data: groups,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("groups/:id")
  async getGroupById(@Param("id") id: string) {
    try {
      const group = await this.atlassianService.getGroupById(id);

      return {
        success: true,
        message: "Grupo encontrado com sucesso",
        data: group,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("groups/atlassian/:groupId")
  async getGroupByAtlassianId(@Param("groupId") groupId: string) {
    try {
      const group = await this.atlassianService.getGroupByAtlassianId(groupId);

      return {
        success: true,
        message: "Grupo encontrado com sucesso",
        data: group,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put("groups/:id")
  async updateGroup(
    @Param("id") id: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @Req() req: Request,
  ) {
    try {
      const userId = req.headers["user-id"] as string;

      const group = await this.atlassianService.updateGroup(
        id,
        updateGroupDto,
        userId,
      );

      return {
        success: true,
        message: "Grupo atualizado com sucesso",
        data: group,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete("groups/:id")
  async deleteGroup(@Param("id") id: string, @Req() req: Request) {
    try {
      const userId = req.headers["user-id"] as string;

      const result = await this.atlassianService.deleteGroup(id, userId);

      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== UTILITÁRIOS ====================

  @Post("groups/seed")
  async seedInitialGroups(@Req() req: Request) {
    try {
      const userId = req.headers["user-id"] as string;

      const result = await this.atlassianService.seedInitialGroups(userId);

      return {
        success: true,
        message: "Grupos iniciais criados com sucesso",
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== VALIDAÇÕES ====================

  @Get("groups/validate/name/:name")
  async validateGroupName(
    @Param("name") name: string,
    @Query("excludeId") excludeId?: string,
  ) {
    try {
      const result = await this.atlassianService.validateGroupName(
        name,
        excludeId,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("groups/validate/atlassian-id/:groupId")
  async validateAtlassianId(
    @Param("groupId") groupId: string,
    @Query("excludeId") excludeId?: string,
  ) {
    try {
      const result = await this.atlassianService.validateAtlassianId(
        groupId,
        excludeId,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
