import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FixitService } from "../services/update.service";
import { FixitDto } from "../dto/update.dto";

@Controller("fixit")
export class FixitController {
  constructor(private readonly fixitService: FixitService) {}

  @Post()
  async fixit(@Body() dto: FixitDto) {
    try {
      if (dto.email === "Por favor, verifique o email.") {
        return { response: "Cliente sem email" };
      }
      return await this.fixitService.fixit(dto.document, dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
