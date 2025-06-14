import { Offboarding } from "@prisma/client";

export class OffboardingEntity implements Offboarding {
  id: string;
  issue_key: string;
  issue_id: number;
  full_name: string;
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
  error_message: string | null;
  deactivated_at: Date;
}
