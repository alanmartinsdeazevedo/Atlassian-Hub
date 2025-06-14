import { HttpService } from "@nestjs/axios";
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import fetch from "node-fetch"; // Certifique-se de ter o pacote node-fetch instalado.
import { firstValueFrom } from "rxjs";

@Injectable()
export class FirstAccessService {
  private readonly localApiUrl = "http://localhost:3002/central/assinante";
  private readonly baseUrl = "https://assinante.alaresinternet.com.br/api/jd";
  private readonly headers = {
    "Content-Type": "application/json",
    Authorization:
      "Bearer Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmb3RvIjpudWxsLCJlbWFpbCI6Imp1bGlhbmF2aWVpcmFic2FudG9zQGdtYWlsLmNvbSIsInRpcG9BY2Vzc28iOjEsImRhdGFVbHRpbW9BY2VpdGUiOm51bGwsInJlZnJlc2hUb2tlbiI6IjdjMjQxODA4LTU1YTEtNDAzZi1iYWI5LTJmNTYzMzZjM2UyYSIsImFwcERlcGxveUlkIjo2NjUsImNvbnRyYXRvSWQiOjgzNSwicGVyZmlsSWQiOjIwOTEsInBlcmZpbE5vbWUiOm51bGwsInVzdWFyaW9JZCI6NTEwNSwidXN1YXJpb05vbWUiOiJKdWxpYW5hIiwidGVtYSI6bnVsbCwibG9naW4iOiI3MDQyNjU3NDQ2MCIsImNvbmNlc3NhbyI6IjIwMjMtMDgtMTJUMjA6MDI6NDQuNzY3NzM2My0wMzowMCIsImRhdGFFeHBpcmFjYW8iOiIyMDIzLTA4LTEzVDIwOjAyOjQ0Ljc2NzczNjYtMDM6MDAiLCJleHAiOjAsImlhdCI6MCwiYXVkIjpudWxsLCJpc3MiOm51bGwsImNvbnRyYXRvcyI6W10sInN1cGVyVXNlciI6ZmFsc2V9.EiHnfk0V5H3Bo5Mdg8hWTQVQEWCp3oYN-sFG7kzFzIg",
  };

  constructor(private readonly httpService: HttpService) {}
  async registerClient(cleanedID: string) {
    try {
      const subscriberResponse = await firstValueFrom(
        this.httpService.post(
          this.localApiUrl,
          { cpfcnpj: cleanedID },
          { headers: { "Content-Type": "application/json" } },
        ),
      );

      console.log("Resposta do subscriber:", subscriberResponse.data);

      const subscriberData = subscriberResponse.data;

      if (subscriberData.status === 404 || subscriberData.status === 422) {
        console.log("Nenhum assinante encontrado.");
        throw new HttpException("EMAIL_NOT_FOUND", HttpStatus.NOT_FOUND);
      }

      if (subscriberData) {
        const password = this.generatePassword();
        const birthday = subscriberData.data_nascimento.split("-");

        const fixitRaw = JSON.stringify({
          cpfCnpj: subscriberData.cpfcnpj,
          name: subscriberData.nomeassinante,
          email: `${subscriberData.email}.csd`,
          password: password,
          lastAcceptedTermsOfUse: new Date().toISOString(),
          birthDay: parseInt(birthday[2]).toString(),
          birthMonth: parseInt(birthday[1]).toString(),
          birthYear: parseInt(birthday[0]).toString(),
        });

        const fixit = await fetch(
          `https://assinante.alaresinternet.com.br/api/jd/subscribers`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              //   Authorization: "Bearer <token>",
            },
            body: fixitRaw,
          },
        );

        const fixitResponse = await fixit.json();
        console.log("Resposta da API fixit:", fixitResponse);

        if (fixit.ok) {
          return {
            statusCode: 201,
            message: "Cliente registrado",
            password: password,
          };
        } else if (fixit.status === 422) {
          throw new HttpException(
            { statusCode: 422, message: "INTER_CREATE" },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        } else {
          throw new HttpException(
            { statusCode: 500, message: "Erro interno" },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }
    } catch (error) {
      console.error("Erro ao registrar cliente:", error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        { statusCode: 500, message: "Erro ao executar Fixit App" },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private generatePassword(): string {
    return Math.random().toString(36).slice(-8);
  }
}
