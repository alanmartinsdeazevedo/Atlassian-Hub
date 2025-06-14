import { Injectable } from "@nestjs/common";
import axios from "axios";
import { CeletiHubAuth } from "../../../../../../common/utils/celetihub-auth.utils";

@Injectable()
export class GetInfoService {
  constructor(private readonly celetiHubAuth: CeletiHubAuth) {}

  async getInfo(document: string): Promise<any> {
    const bearer = await this.celetiHubAuth.authenticate();
    try {
      const response = await axios.get(
        `https://api.celetihub.com.br/api/subscribers/${document}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearer}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  }
}
