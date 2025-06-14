import { IsString, IsNotEmpty } from "class-validator";

export class GetInfoDto {
  @IsString()
  @IsNotEmpty()
  document: string;
}
