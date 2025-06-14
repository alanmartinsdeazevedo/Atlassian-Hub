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
  ValidationPipe,
  UsePipes,
} from "@nestjs/common";
import { Request } from "express";
import { AtlassianService } from "./atlassian.service";
import {
  CreateGroupDto,
  UpdateGroupDto,
  InviteUserDto,
  GetGroupsQueryDto,
  SearchUserQueryDto,
  GetLicenseUsageParamsDto,
  ValidateGroupNameParamsDto,
  ValidateGroupNameQueryDto,
  ValidateAtlassianIdParamsDto,
  ValidateAtlassianIdQueryDto,
} from "./dto/atlassian.dto";

@Controller("atlassian")
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AtlassianController {
  constructor(private readonly atlassianService: AtlassianService) {}

  // ==================== ENDPOINTS DE LICENÇAS ====================

  /**
   * ✅ GET /atlassian/licenses/usage/:product
   * Consulta o uso de licenças para um produto específico
   */
  @Get("licenses/usage/:product")
  async getLicenseUsage(@Param() params: GetLicenseUsageParamsDto) {
    try {
      const licenseData =
        await this.atlassianService.getApproximateLicenseCount(params.product);

      return {
        success: true,
        message: `Uso de licenças para ${params.product} consultado com sucesso`,
        data: licenseData,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro ao consultar uso de licenças",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ GET /atlassian/licenses/usage
   * Consulta o uso de licenças para Jira Service Desk (padrão)
   */
  @Get("licenses/usage")
  async getDefaultLicenseUsage() {
    try {
      const licenseData =
        await this.atlassianService.getApproximateLicenseCount(
          "jira-servicedesk",
        );

      return {
        success: true,
        message: "Uso de licenças consultado com sucesso",
        data: licenseData,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro ao consultar uso de licenças",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ GET /atlassian/licenses/detailed
   * Consulta detalhada de licenças para múltiplos produtos
   */
  @Get("licenses/detailed")
  async getDetailedLicenseUsage() {
    try {
      const licenseData = await this.atlassianService.getDetailedLicenseUsage();

      return {
        success: true,
        message: "Uso detalhado de licenças consultado com sucesso",
        data: licenseData,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro ao consultar uso detalhado de licenças",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== ENDPOINTS DE USUÁRIOS ====================

  /**
   * ✅ GET /atlassian/users/search
   * Busca usuários no Atlassian
   */
  @Get("users/search")
  async searchUser(@Query() queryDto: SearchUserQueryDto) {
    try {
      const userData = await this.atlassianService.searchAtlassianUser(
        queryDto.query,
      );

      return {
        success: true,
        message: "Busca de usuário realizada com sucesso",
        data: userData,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro ao buscar usuário",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ POST /atlassian/users/invite
   * Convida usuário para o Atlassian
   */
  @Post("users/invite")
  async inviteUser(@Body() inviteUserDto: InviteUserDto, @Req() req: Request) {
    try {
      const userId = req.headers["user-id"] as string;

      if (!inviteUserDto.email) {
        throw new HttpException("Email é obrigatório", HttpStatus.BAD_REQUEST);
      }

      const result = await this.atlassianService.inviteUser(
        inviteUserDto.email,
      );

      return {
        success: true,
        message: `Convite enviado para ${inviteUserDto.email} com sucesso`,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro ao enviar convite",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== CRUD GRUPOS (EXISTENTE) ====================

  @Post("groups")
  async createGroup(
    @Body() createGroupDto: CreateGroupDto,
    @Req() req: Request,
  ) {
    try {
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
  async getAllGroups(@Query() queryDto: GetGroupsQueryDto) {
    try {
      const filters = {
        isActive: queryDto.isActive,
        search: queryDto.search,
        orderBy: queryDto.orderBy || "order",
        orderDirection: queryDto.orderDirection || "asc",
        limit: queryDto.limit || 50,
        offset: queryDto.offset || 0,
      };

      const result = await this.atlassianService.getAllGroups(filters);

      return {
        success: true,
        message: "Grupos encontrados com sucesso",
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
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
    @Param() params: ValidateGroupNameParamsDto,
    @Query() queryDto: ValidateGroupNameQueryDto,
  ) {
    try {
      const result = await this.atlassianService.validateGroupName(
        params.name,
        queryDto.excludeId,
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
    @Param() params: ValidateAtlassianIdParamsDto,
    @Query() queryDto: ValidateAtlassianIdQueryDto,
  ) {
    try {
      const result = await this.atlassianService.validateAtlassianId(
        params.groupId,
        queryDto.excludeId,
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
