import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class CentralService {
  private readonly apiUrl =
    "http://irisapi.alaresinternet.com.br/api/ura/assinante_por_cpfcnpj";
  private readonly integrationSecret = "7f01a198-7268-483f-8f61-199f5be065d4";
  private readonly authorizationToken =
    "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmb3RvIjpudWxsLCJlbWFpbCI6InBlZHJvZ19zaWx2YUBvdXRsb29rLmNvbSIsInRpcG9BY2Vzc28iOjEsImRhdGFVbHRpbW9BY2VpdGUiOm51bGwsInJlZnJlc2hUb2tlbiI6IjIwOTY0NTQ2LTM4MDUtNGRiMi05ZTM5LTE0NmYyNWZiYzZjOCIsImFwcERlcGxveUlkIjo2MDYsImNvbnRyYXRvSWQiOjczMiwicGVyZmlsSWQiOjE4MzksInBlcmZpbE5vbWUiOm51bGwsInVzdWFyaW9JZCI6MzQwOTIxLCJ1c3VhcmlvTm9tZSI6IlBlZHJvIEdhYnJpZWwgZGEgU2lsdmEiLCJ0ZW1hIjpudWxsLCJsb2dpbiI6IjQ4MDQ2ODc3ODU5IiwiY29uY2Vzc2FvIjoiMjAyNC0wNi0xOVQxMToxOTowNS4wMjExMDY1LTAzOjAwIiwiZGF0YUV4cGlyYWNhbyI6IjIwMjQtMDYtMjBUMTE6MTk6MDUuMDIxMTM1My0wMzowMCIsImV4cCI6MCwiaWF0IjowLCJhdWQiOm51bGwsImlzcyI6bnVsbCwiY29udHJhdG9zIjpbXSwic3VwZXJVc2VyIjpmYWxzZX0.yAtnUIAkNkok77HnNPjUAhMZ3biO9JhHjDQSu4dVFMw";

  constructor(private readonly httpService: HttpService) {}

  async getAssinantePorCpfCnpj(cpfcnpj: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          this.apiUrl,
          { cpfcnpj },
          {
            headers: {
              IntegrationSecret: this.integrationSecret,
              "Content-Type": "application/json",
              Authorization: this.authorizationToken,
            },
          },
        ),
      );

      const assinante = Array.isArray(response.data)
        ? response.data[0]
        : response.data;

      return assinante;
    } catch (error) {
      throw new HttpException(
        error.response?.data || "Erro ao realizar a requisição.",
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
