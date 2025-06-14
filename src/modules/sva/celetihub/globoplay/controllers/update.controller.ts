import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { UpdateService } from "../services/update.service";
import { FixitDto } from "../dto/update.dto";

@Controller("celetihub/update")
export class FixitController {
  constructor(private readonly updateService: UpdateService) {}

  @Post()
  @HttpCode(200)
  async update(@Body() dto: FixitDto) {
    try {
      if (dto.email === "Por favor, verifique o email.") {
        return { response: "Cliente sem email" };
      }
      return await this.updateService.update(dto.document, dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
