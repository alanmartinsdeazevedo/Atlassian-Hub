import { IsString, IsNotEmpty, IsInt } from "class-validator";

export class DeactivateOffboardingDto {
  @IsString()
  @IsNotEmpty()
  issueKey: string;

  @IsInt()
  @IsNotEmpty()
  issueId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  cpf: string;
}
