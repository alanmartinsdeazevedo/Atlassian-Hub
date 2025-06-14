import { Injectable } from "@nestjs/common";
import axios from "axios";
import { CeletiHubAuth } from "../../../../../../common/utils/celetihub-auth.utils";

@Injectable()
export class ResendEmailService {
  constructor(private readonly celetiHubAuth: CeletiHubAuth) {}

  async resendEmail(document: string, product_id: string): Promise<any> {
    const bearer = await this.celetiHubAuth.authenticate();
    try {
      const response = await axios.post(
        "https://api.celetihub.com.br/api/subscribers/resend_activation_email",
        { document, product_id },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearer}`,
            Origin: "https://plataforma.celetihub.com.br",
          },
        },
      );
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  }
}
