import {
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Put,
} from "@nestjs/common";
import { ResetPasswordService } from "./reset-password.service";

@Controller("central/reset-password")
export class ResetPasswordController {
  constructor(private readonly resetPasswordService: ResetPasswordService) {}

  @Put(":cleanedID")
  async resetPassword(@Param("cleanedID") cleanedID: string): Promise<any> {
    try {
      const result = await this.resetPasswordService.resetPassword(cleanedID);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || "Erro ao resetar a senha.",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
