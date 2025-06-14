import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { GetInfoService } from "../services/info.service";
import { GetInfoDto } from "../dto/info.dto";

@Controller("celetihub/info")
export class GetInfoController {
  constructor(private readonly getInfoService: GetInfoService) {}

  @Get(":document")
  @HttpCode(200)
  async getInfo(@Param() params: GetInfoDto) {
    try {
      return await this.getInfoService.getInfo(params.document);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
