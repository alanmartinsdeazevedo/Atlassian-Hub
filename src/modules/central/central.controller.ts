import { Controller, Post, Body } from "@nestjs/common";
import { CentralService } from "./central.service";

@Controller("central")
export class CentralController {
  constructor(private readonly uraService: CentralService) {}

  @Post("assinante")
  async getAssinantePorCpfCnpj(@Body("cpfcnpj") cpfcnpj: string) {
    return this.uraService.getAssinantePorCpfCnpj(cpfcnpj);
  }
}
