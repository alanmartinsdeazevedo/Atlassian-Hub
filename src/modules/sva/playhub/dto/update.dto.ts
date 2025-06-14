import { IsString, IsNotEmpty } from "class-validator";

export class FixitDto {
  @IsString()
  @IsNotEmpty()
  Document: string;

  @IsString()
  @IsNotEmpty()
  Password: string;

  @IsString()
  @IsNotEmpty()
  Name: string;

  @IsString()
  @IsNotEmpty()
  Email: string;

  @IsString()
  @IsNotEmpty()
  Mobile: string;
}
