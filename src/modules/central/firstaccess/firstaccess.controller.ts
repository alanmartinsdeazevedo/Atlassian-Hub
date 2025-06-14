import { Controller, Post, Param, Body } from "@nestjs/common";
import { FirstAccessService } from "./firstaccess.service";

@Controller("central/firstaccess")
export class FirstAccessController {
  constructor(private readonly firstAccessService: FirstAccessService) {}

  @Post(":cleanedID")
  async registerClient(
    @Param("cleanedID") cleanedID: string,
    @Body("username") username: string,
    @Body("product_name") product_name: string,
  ) {
    const response = await this.firstAccessService.registerClient(cleanedID);

    console.log("Response do service:", response);

    return response;
  }
}
