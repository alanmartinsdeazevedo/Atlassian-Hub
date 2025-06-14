import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ResendEmailService } from "../services/resend-email.service";
import { ResendEmailDto } from "../dto/resend-email.dto";

@Controller("resend-email")
export class ResendEmailController {
  constructor(private readonly resendEmailService: ResendEmailService) {}

  @Post()
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
