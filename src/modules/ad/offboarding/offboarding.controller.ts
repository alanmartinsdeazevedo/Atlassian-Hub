import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
  Param,
} from "@nestjs/common";
import { OffboardingService } from "./offboarding.service";
import { DeactivateOffboardingDto } from "./dto/offboarding.dto";

@Controller("ad/offboarding")
export class OffboardingController {
  constructor(private readonly onboardingService: OffboardingService) {}

  @Post()
  async deactivate(@Body() body: any) {
    try {
      const dto: DeactivateOffboardingDto = {
        issueKey: body.key,
        issueId: body.id,
        name: body.name,
        cpf: body.cpf,
      };
      console.log("DTO:", dto);
      return await this.onboardingService.deactivateByIssue(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get("/log/:issueKey")
  async findLog(@Param("issueKey") issueKey: string) {
    try {
      return await this.onboardingService.findLog(issueKey);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
