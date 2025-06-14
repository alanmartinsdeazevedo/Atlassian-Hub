import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
  Param,
} from "@nestjs/common";
import { OnboardingService } from "./onboarding.service";
import { CreateOnboardingDto } from "./dto/create-onboarding.dto";

@Controller("ad/onboarding")
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  async create(@Body() body: any) {
    try {
      console.log(body);
      const dto: CreateOnboardingDto = {
        issueKey: body.key,
        issueId: body.id,
        name: body.name,
        cpf: body.cpf,
        cargo: body.cargo,
        setor: body.setor,
        departamento: body.departamento,
        gestor: body.gestor,
        cidade_uf: body.cidade_uf,
      };
      return await this.onboardingService.create(dto);
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
