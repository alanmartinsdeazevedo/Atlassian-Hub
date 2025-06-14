import axios from "axios";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PlayHubAuth {
  constructor(private readonly configService: ConfigService) {}

  async authenticate(): Promise<string> {
    try {
      const response = await axios.post(
        `${this.configService.get("PLAYHUB_API_URL")}/v3/authentication/tokens`,
        {
          ApiKey: this.configService.get("PLH_KEY_ALARES"),
          ApiSecret: this.configService.get("PLH_SECRET_ALARES"),
        },
      );
      return response.data.AccessToken;
    } catch (error) {
      console.error(error);
      throw new Error("Não foi possível autenticar");
    }
  }
}
