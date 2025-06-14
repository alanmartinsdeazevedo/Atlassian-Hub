import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEmail,
  IsUUID,
  IsIn,
} from "class-validator";
import { Transform } from "class-transformer";

// ==================== DTOs DE GRUPOS ====================

export class CreateGroupDto {
  @IsString()
  group_id: string;

  @IsString()
  group_name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  order?: number;
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  group_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  order?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  is_active?: boolean;
}

export class GetGroupsQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true")
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(["order", "name", "created_at"])
  orderBy?: "order" | "name" | "created_at";

  @IsOptional()
  @IsIn(["asc", "desc"])
  orderDirection?: "asc" | "desc";

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  offset?: number;
}

// ==================== DTOs DE USUÁRIOS ====================

export class InviteUserDto {
  @IsEmail()
  email: string;
}

export class SearchUserQueryDto {
  @IsString()
  query: string;
}

// ==================== DTOs DE LICENÇAS ====================

export class GetLicenseUsageParamsDto {
  @IsString()
  @IsIn(["jira-servicedesk", "jira-software", "confluence"])
  product: string;
}

// ==================== DTOs DE VALIDAÇÃO ====================

export class ValidateGroupNameParamsDto {
  @IsString()
  name: string;
}

export class ValidateGroupNameQueryDto {
  @IsOptional()
  @IsUUID()
  excludeId?: string;
}

export class ValidateAtlassianIdParamsDto {
  @IsString()
  groupId: string;
}

export class ValidateAtlassianIdQueryDto {
  @IsOptional()
  @IsUUID()
  excludeId?: string;
}
