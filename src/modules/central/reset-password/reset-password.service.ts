import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class ResetPasswordService {
  private readonly localApiUrl = "http://localhost:3002/central/assinante";
  private readonly baseUrl = "https://assinante.alaresinternet.com.br/api/jd";
  private readonly headers = {
    "Content-Type": "application/json",
    Authorization:
      "Bearer Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmb3RvIjpudWxsLCJlbWFpbCI6Imp1bGlhbmF2aWVpcmFic2FudG9zQGdtYWlsLmNvbSIsInRpcG9BY2Vzc28iOjEsImRhdGFVbHRpbW9BY2VpdGUiOm51bGwsInJlZnJlc2hUb2tlbiI6IjdjMjQxODA4LTU1YTEtNDAzZi1iYWI5LTJmNTYzMzZjM2UyYSIsImFwcERlcGxveUlkIjo2NjUsImNvbnRyYXRvSWQiOjgzNSwicGVyZmlsSWQiOjIwOTEsInBlcmZpbE5vbWUiOm51bGwsInVzdWFyaW9JZCI6NTEwNSwidXN1YXJpb05vbWUiOiJKdWxpYW5hIiwidGVtYSI6bnVsbCwibG9naW4iOiI3MDQyNjU3NDQ2MCIsImNvbmNlc3NhbyI6IjIwMjMtMDgtMTJUMjA6MDI6NDQuNzY3NzM2My0wMzowMCIsImRhdGFFeHBpcmFjYW8iOiIyMDIzLTA4LTEzVDIwOjAyOjQ0Ljc2NzczNjYtMDM6MDAiLCJleHAiOjAsImlhdCI6MCwiYXVkIjpudWxsLCJpc3MiOm51bGwsImNvbnRyYXRvcyI6W10sInN1cGVyVXNlciI6ZmFsc2V9.EiHnfk0V5H3Bo5Mdg8hWTQVQEWCp3oYN-sFG7kzFzIg",
  };

  constructor(private readonly httpService: HttpService) {}

  async resetPassword(cleanedID: string): Promise<any> {
    try {
      // 1. Buscar informações do cliente
      const subscriberResponse = await firstValueFrom(
        this.httpService.post(
          this.localApiUrl,
          { cpfcnpj: cleanedID },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      );

      const subscriberData = subscriberResponse.data;
      const { data_nascimento: birthday } = subscriberData;

      if (!birthday) {
        throw new HttpException(
          "Data de nascimento não encontrada.",
          HttpStatus.BAD_REQUEST,
        );
      }

      // 2. Gerar nova senha
      const password = this.generatePassword();
      const [year, month, day] = birthday.split("-");

      const resetPayload = {
        password,
        confirmPassword: password,
        birthDay: parseInt(day).toString(),
        birthMonth: parseInt(month).toString(),
        birthYear: parseInt(year).toString(),
      };

      // 3. Resetar senha
      const resetResponse = await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/reset-password/${cleanedID}`,
          resetPayload,
          {
            headers: this.headers,
          },
        ),
      );

      if (resetResponse.data !== true) {
        throw new HttpException(
          "Falha ao resetar a senha.",
          HttpStatus.BAD_REQUEST,
        );
      }

      // 4. Retornar resultado
      return {
        statusCode: 200,
        password,
      };
    } catch (error) {
      throw new HttpException(
        error.response?.data || "Erro ao resetar a senha.",
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private generatePassword(): string {
    const letrasMaiusculas = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const letrasMinusculas = "abcdefghijklmnopqrstuvwxyz";
    const numeros = "0123456789";
    const caracteresEspeciais = "@#!";

    const primeiraLetra =
      letrasMaiusculas[Math.floor(Math.random() * letrasMaiusculas.length)];
    const outrasLetras = Array.from(
      { length: 5 },
      () =>
        letrasMinusculas[Math.floor(Math.random() * letrasMinusculas.length)],
    ).join("");
    const numero = numeros[Math.floor(Math.random() * numeros.length)];
    const caractereEspecial =
      caracteresEspeciais[
        Math.floor(Math.random() * caracteresEspeciais.length)
      ];

    return primeiraLetra + outrasLetras + numero + caractereEspecial;
  }
}
