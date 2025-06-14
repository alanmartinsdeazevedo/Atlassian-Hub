import { Injectable } from "@nestjs/common";
import axios from "axios";
import { CeletiHubAuth } from "../../../../../../common/utils/celetihub-auth.utils";

@Injectable()
export class FixitService {
  constructor(private readonly celetiHubAuth: CeletiHubAuth) {}

  async fixit(document: string, requestData: any): Promise<any> {
    const bearer = await this.celetiHubAuth.authenticate();
    try {
      const response = await axios.put(
        `https://api.celetihub.com.br/api/subscribers/${document}`,
        requestData,
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
