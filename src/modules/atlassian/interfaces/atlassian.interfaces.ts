// ==================== INTERFACES DE GRUPOS ====================

export interface CreateGroupDto {
  group_id: string;
  group_name: string;
  description?: string;
  order?: number;
}

export interface UpdateGroupDto {
  group_name?: string;
  description?: string;
  order?: number;
  is_active?: boolean;
}

export interface GroupFilters {
  isActive?: boolean;
  search?: string;
  orderBy: "order" | "name" | "created_at";
  orderDirection: "asc" | "desc";
  limit: number;
  offset: number;
}

// ==================== INTERFACES DE LICENÇAS ====================

export interface LicenseUsageData {
  product: string;
  currentUsage: number;
  approximateCount: number;
  timestamp: Date;
}

export interface LicenseStats {
  used: number;
  available: number;
  total: number;
  usagePercentage: number;
  status: "normal" | "warning" | "critical";
}

// ==================== INTERFACES DE USUÁRIOS ====================

export interface InviteUserDto {
  email: string;
}

export interface AtlassianUserData {
  accountId: string;
  displayName: string;
  emailAddress: string;
  accountType: string;
  active: boolean;
  avatarUrls: {
    "48x48": string;
    "24x24": string;
    "16x16": string;
  };
}

// ==================== INTERFACES DE RESPOSTA DA API ====================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ValidationResponse {
  isValid: boolean;
  exists: boolean;
  message?: string;
}
