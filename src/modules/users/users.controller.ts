import {
  Controller,
  Get,
  Put,
  Delete,
  Patch,
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
import { UsersService } from "./users.service";
import {
  UpdateUserDto,
  ChangeRoleDto,
  GetUsersQueryDto,
  GetUserLogsQueryDto,
} from "./dto/users.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==================== LEITURA DE USUÁRIOS ====================

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAllUsers(@Query() query: GetUsersQueryDto) {
    try {
      const filters = {
        isActive:
          query.isActive !== undefined ? query.isActive === "true" : undefined,
        roleId: query.roleId || undefined,
        search: query.search || undefined,
        orderBy: query.orderBy || "created_at",
        orderDirection: query.orderDirection || "desc",
        limit: query.limit || 50,
        offset: query.offset || 0,
      };

      const result = await this.usersService.getAllUsers(filters);

      return {
        success: true,
        message: "Usuários recuperados com sucesso",
        data: result.users,
        pagination: result.pagination,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("stats")
  async getSystemStats() {
    try {
      const stats = await this.usersService.getSystemStats();

      return {
        success: true,
        message: "Estatísticas do sistema recuperadas com sucesso",
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("role/:roleId")
  async getUsersByRole(@Param("roleId") roleId: string) {
    try {
      const users = await this.usersService.getUsersByRole(roleId);

      return {
        success: true,
        message: "Usuários da role recuperados com sucesso",
        data: users,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(":id")
  async getUserById(
    @Param("id") id: string,
    @Query("includeStats") includeStats?: string,
  ) {
    try {
      const user = await this.usersService.getUserById(
        id,
        includeStats === "true",
      );

      return {
        success: true,
        message: "Usuário encontrado com sucesso",
        data: user,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(":id/stats")
  async getUserStats(@Param("id") id: string) {
    try {
      const stats = await this.usersService.getUserStats(id);

      return {
        success: true,
        message: "Estatísticas do usuário recuperadas com sucesso",
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(":id/logs")
  @UsePipes(new ValidationPipe({ transform: true }))
  async getUserLogs(
    @Param("id") id: string,
    @Query() query: GetUserLogsQueryDto,
  ) {
    try {
      const options = {
        type: query.type || "all",
        limit: query.limit || 50,
        offset: query.offset || 0,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        action: query.action || undefined,
      };

      const result = await this.usersService.getUserLogs(id, options);

      return {
        success: true,
        message: "Logs do usuário recuperados com sucesso",
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== ATUALIZAÇÃO DE USUÁRIOS ====================

  @Put(":id")
  @UsePipes(new ValidationPipe())
  async updateUser(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ) {
    try {
      const updatedBy = req.headers["user-id"] as string;

      const user = await this.usersService.updateUser(
        id,
        updateUserDto,
        updatedBy,
      );

      return {
        success: true,
        message: "Usuário atualizado com sucesso",
        data: user,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(":id/toggle-status")
  async toggleUserStatus(@Param("id") id: string, @Req() req: Request) {
    try {
      const changedBy = req.headers["user-id"] as string;

      const user = await this.usersService.toggleUserStatus(id, changedBy);

      return {
        success: true,
        message: `Usuário ${user.is_active ? "ativado" : "desativado"} com sucesso`,
        data: user,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(":id/role")
  @UsePipes(new ValidationPipe())
  async changeUserRole(
    @Param("id") id: string,
    @Body() changeRoleDto: ChangeRoleDto,
    @Req() req: Request,
  ) {
    try {
      const changedBy = req.headers["user-id"] as string;

      const user = await this.usersService.changeUserRole(
        id,
        changeRoleDto.role_id,
        changedBy,
      );

      return {
        success: true,
        message: "Role do usuário alterada com sucesso",
        data: user,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(":id/last-login")
  async updateLastLogin(@Param("id") id: string) {
    try {
      await this.usersService.updateLastLogin(id);

      return {
        success: true,
        message: "Last login atualizado com sucesso",
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Erro interno do servidor",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== EXCLUSÃO (SOFT DELETE) ====================

  @Delete(":id")
  async deleteUser(@Param("id") id: string, @Req() req: Request) {
    try {
      const deletedBy = req.headers["user-id"] as string;

      const result = await this.usersService.deleteUser(id, deletedBy);

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
}
