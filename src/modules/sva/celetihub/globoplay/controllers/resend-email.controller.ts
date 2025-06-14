import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { ResendEmailService } from "../services/resend-email.service";
import { ResendEmailDto } from "../dto/resend-email.dto";

@Controller("/celetihub/resend-email")
export class ResendEmailController {
  constructor(private readonly resendEmailService: ResendEmailService) {}

  @Post()
  @HttpCode(200)
  async resend(@Body() dto: ResendEmailDto) {
    try {
      return await this.resendEmailService.resendEmail(
        dto.document,
        dto.product_id,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
