import { IsString, IsNotEmpty } from "class-validator";

export class ResendEmailDto {
  @IsString()
  @IsNotEmpty()
  document: string;

  @IsString()
  @IsNotEmpty()
  product_id: string;
}
