import { Injectable } from "@nestjs/common";
import axios from "axios";
import { PlayHubAuth } from "../../../../../common/utils/playhub-auth.utils";

@Injectable()
export class GetInfoService {
  constructor(private readonly playHubAuth: PlayHubAuth) {}

  async getInfo(document: string): Promise<any> {
    const bearer = await this.playHubAuth.authenticate();
    try {
      const customerResponse = await axios.get(
        `https://www.playhub.com.br/API/PlayhubApi/api/v3/customers/${document}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearer}`,
          },
        },
      );

      if (!customerResponse.data) {
        throw new Error("Customer not found");
      }

      const subscriptionsResponse = await axios.get(
        `https://www.playhub.com.br/API/PlayhubApi/api/v3/customers/${document}/subscriptions`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearer}`,
          },
        },
      );

      const customerInfo = customerResponse.data;
      const subscriptions = subscriptionsResponse.data;

      return {
        ...customerInfo,
        subscriptions,
      };
    } catch (error) {
      throw error.response.data;
    }
  }
}
