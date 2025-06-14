import { Onboarding } from "@prisma/client";

export class OnboardingEntity implements Onboarding {
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
  created_at: Date;
  updated_at: Date;
}
