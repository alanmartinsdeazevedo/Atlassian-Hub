import { IsString, IsNotEmpty, IsInt } from "class-validator";

export class CreateOnboardingDto {
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

  @IsString()
  @IsNotEmpty()
  cargo: string;

  @IsString()
  @IsNotEmpty()
  setor: string;

  @IsString()
  @IsNotEmpty()
  departamento: string;

  @IsString()
  @IsNotEmpty()
  gestor: string;

  @IsString()
  @IsNotEmpty()
  cidade_uf: string;
}
