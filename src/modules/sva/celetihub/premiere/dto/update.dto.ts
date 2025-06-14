import { IsString, IsNotEmpty } from "class-validator";

export class FixitDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  document: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  internet_speed_id: string;

  @IsString()
  @IsNotEmpty()
  customer_plan: string;
}
