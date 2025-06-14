import { Transform } from "class-transformer";
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from "class-validator";

// ==================== BASIC DTOs ====================

export class CreateUserDto {
  @IsString()
  ms_id: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  profile_image?: string;

  @IsUUID()
  role_id: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  profile_image?: string;

  @IsOptional()
  @IsUUID()
  role_id?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class ChangeRoleDto {
  @IsUUID()
  role_id: string;
}

// ==================== QUERY DTOs ====================

export class GetUsersQueryDto {
  @IsOptional()
  @IsEnum(["true", "false"])
  isActive?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(["name", "email", "created_at", "last_login"])
  orderBy?: "name" | "email" | "created_at" | "last_login";

  @IsOptional()
  @IsEnum(["asc", "desc"])
  orderDirection?: "asc" | "desc";

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  offset?: number;
}

export class GetUserLogsQueryDto {
  @IsOptional()
  @IsEnum(["all", "system", "atlassian"])
  type?: "all" | "system" | "atlassian";

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  action?: string;
}

// ==================== RESPONSE DTOs ====================

export class UserResponseDto {
  id: string;
  ms_id: string;
  name: string;
  email: string;
  profile_image?: string;
  is_active: boolean;
  last_login: Date;
  created_at: Date;
  updated_at: Date;
  role: {
    id: string;
    role: string;
    description: string;
  };
  _count?: {
    Log: number;
    AtlassianLog: number;
  };
}

export class PaginationDto {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export class GetUsersResponseDto {
  success: boolean;
  message: string;
  data: UserResponseDto[];
  pagination: PaginationDto;
}

export class UserStatsDto {
  user: {
    id: string;
    name: string;
    created_at: Date;
    last_login: Date;
  };
  totalLogs: number;
  systemLogs: {
    total: number;
    last30Days: number;
    last7Days: number;
  };
  atlassianLogs: {
    total: number;
    last30Days: number;
    last7Days: number;
  };
  topActions: Array<{
    action: string;
    count: number;
  }>;
  accountAge: number;
  lastLoginDaysAgo: number | null;
}

export class SystemStatsDto {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  recentUsers: number;
  activeUsersLast30Days: number;
  usersByRole: Array<{
    role: string;
    count: number;
  }>;
  activityRate: number;
}

export class UserLogDto {
  id: string;
  action: string;
  response?: string;
  status?: string;
  target_email?: string;
  error_message?: string;
  created_at: Date;
  type: "system" | "atlassian";
  group?: {
    group_name: string;
  };
}

export class GetUserLogsResponseDto {
  user: {
    id: string;
    name: string;
    email: string;
  };
  logs: UserLogDto[];
  stats: {
    systemLogs: number;
    atlassianLogs: number;
    totalLogs: number;
  };
  pagination: PaginationDto;
}

// ==================== SUCCESS RESPONSE DTOs ====================

export class SuccessResponseDto {
  success: boolean;
  message: string;
  data?: any;
}

export class UserOperationResponseDto extends SuccessResponseDto {
  data: UserResponseDto;
}

export class UserStatsResponseDto extends SuccessResponseDto {
  data: UserStatsDto;
}

export class SystemStatsResponseDto extends SuccessResponseDto {
  data: SystemStatsDto;
}
