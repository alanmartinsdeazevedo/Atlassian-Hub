import { Injectable } from "@nestjs/common";
import axios from "axios";
import { PlayHubAuth } from "../../../../../common/utils/playhub-auth.utils";

@Injectable()
export class FixitService {
  constructor(private readonly playHubAuth: PlayHubAuth) {}

  async update(requestData: any): Promise<any> {
    console.log("FixitService.update: Initializing update flow");
    const bearer = await this.playHubAuth.authenticate();
    console.log("FixitService.update: Got bearer token");
    try {
      const formattedData = {
        Password: requestData.Password,
        Name: requestData.Name,
        Email: requestData.Email.split(";")[0],
        Mobile: requestData.Mobile,
      };

      console.log(
        "FixitService.update: Updating customer using PlayHub API",
        formattedData,
      );

      const response = await axios.put(
        `https://www.playhub.com.br/API/PlayhubApi/api/v3/customers/${requestData.Document}`,
        formattedData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearer}`,
          },
        },
      );

      console.log("FixitService.update: Got response from PlayHub API");
      console.log(response.data);

      return response.data;
    } catch (error) {
      console.error("FixitService.update: Error during update", error);
      throw error.response?.data || error.message;
    }
  }
}
