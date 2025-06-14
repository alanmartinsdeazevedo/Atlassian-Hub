import axios from "axios";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class CeletiHubAuth {
  constructor(private readonly configService: ConfigService) {}

  async authenticate(): Promise<string> {
    try {
      const response = await axios.post(
        `${this.configService.get("CELETIHUB_API_URL")}/authenticate`,
        {
          access_token: this.configService.get("CELETIHUB_ACCESS_TOKEN"),
        },
      );
      return response.data.authorization.token;
    } catch (error) {
      console.error(error);
      throw new Error("Não foi possível autenticar");
    }
  }
}
