import { Injectable } from "@nestjs/common";
import { Client, Change, Attribute } from "ldapts";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class LdapService {
  private client: Client;
  private prisma: PrismaClient;
  private encodePasswordForAD(password: string): Buffer {
    const quotedPassword = `"${password}"`;
    return Buffer.from(quotedPassword, "utf16le");
  }
  private generateNamePassword(): string {
    const personagens = [
      // Mugiwaras
      "Luffy",
      "Zoro",
      "Nami",
      "Usopp",
      "Sanji",
      "Chopper",
      "Robin",
      "Franky",
      "Brook",
      "Jinbe",
      // Outros piratas famosos
      "Shanks",
      "Buggy",
      "Crocodile",
      "Doflamingo",
      "Katakuri",
      "Marco",
      "Ace",
      "Sabo",
      // Marinheiros
      "Garp",
      "Sengoku",
      "Aokiji",
      "Akainu",
      "Kizaru",
      "Smoker",
      "Tashigi",
      "Koby",
      // Outros personagens
      "Vivi",
      "Hancock",
      "Rayleigh",
      "Whitebeard",
      "Kaido",
      "BigMom",
      "Yamato",
      "Carrot",
      "Law",
      "Kid",
      "Bonney",
      "Drake",
      "Hawkins",
      "Bege",
      "Urouge",
      "Apoo",
      "Mihawk",
      "Perona",
      "Moria",
      "Kuma",
      "Ivankov",
      "Jinbei",
      "Fisher",
      "Otohime",
    ];

    const sufixos = [
      // Sufixos gerais
      "san",
      "kun",
      "chan",
      "sama",
      "nha",
      "ito",
      "eta",
      "oso",
      "ada",
      // Temáticos de One Piece
      "pirate",
      "marine",
      "crew",
      "ship",
      "king",
      "queen",
      "captain",
    ];

    const numbers = "0123456789";
    const specialChars = "@#!%*";

    // Escolher personagem base
    const personagem =
      personagens[Math.floor(Math.random() * personagens.length)];

    // Construir palavra base
    let palavra = personagem.toLowerCase();

    // Se o nome for muito curto, adicionar sufixo
    if (palavra.length < 8) {
      const sufixo = sufixos[Math.floor(Math.random() * sufixos.length)];
      palavra += sufixo;
    }

    // Ajustar para exatamente 10 caracteres (deixando 2 para número + especial = 12 total)
    if (palavra.length > 10) {
      palavra = palavra.substring(0, 10);
    } else if (palavra.length < 10) {
      // Completar com sufixo se necessário
      const sufixo = sufixos[Math.floor(Math.random() * sufixos.length)];
      palavra += sufixo;
      palavra = palavra.substring(0, 10); // Garantir máximo 10
    }

    // Primeira letra maiúscula
    palavra = palavra.charAt(0).toUpperCase() + palavra.slice(1);

    const number = numbers[Math.floor(Math.random() * numbers.length)];
    const specialChar =
      specialChars[Math.floor(Math.random() * specialChars.length)];

    const password = palavra + number + specialChar;

    console.log(
      `Senha gerada: ${password} (${password.length} caracteres) - baseada em "${personagem}"`,
    );
    return password;
  }
  private generateThematicPassword(): string {
    const elementos = [
      // Frutas do Diabo
      "Gomugomu",
      "Meramera",
      "Hiehie",
      "Yamiami",
      "Nikanic",
      // Técnicas
      "Gearfour",
      "Santoryu",
      "Diableja",
      "Roomsham",
      "Kingkon",
      // Locais
      "Grandlin",
      "Redlinea",
      "Fishman",
      "Skypiea",
      "Wanocou",
    ];

    const numbers = "0123456789";
    const specialChars = "@#!%*";

    // Escolher elemento base (já com 8-9 caracteres)
    const elemento = elementos[Math.floor(Math.random() * elementos.length)];
    let palavra = elemento.toLowerCase();

    // Ajustar para exatamente 10 caracteres
    if (palavra.length > 10) {
      palavra = palavra.substring(0, 10);
    } else if (palavra.length < 10) {
      // Adicionar sufixo simples
      const sufixos = ["ne", "ta", "ro", "sa", "mi", "ka", "to"];
      const sufixo = sufixos[Math.floor(Math.random() * sufixos.length)];
      palavra += sufixo;
      palavra = palavra.substring(0, 10);
    }

    // Primeira letra maiúscula
    palavra = palavra.charAt(0).toUpperCase() + palavra.slice(1);

    const number = numbers[Math.floor(Math.random() * numbers.length)];
    const specialChar =
      specialChars[Math.floor(Math.random() * specialChars.length)];

    const password = palavra + number + specialChar;

    console.log(
      `Senha temática gerada: ${password} (${password.length} caracteres) - baseada em "${elemento}"`,
    );
    return password;
  }

  private generateSecurePassword(): string {
    const usePersonagem = Math.random() < 0.6;

    if (usePersonagem) {
      return this.generateNamePassword();
    } else {
      return this.generateThematicPassword();
    }
  }

  private validatePasswordPolicy(password: string): boolean {
    console.log(`Validando senha: ${password} (${password.length} caracteres)`);

    if (password.length < 12) {
      console.error("Senha muito curta (mínimo 12 caracteres)");
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      console.error("Senha deve conter pelo menos uma letra maiúscula");
      return false;
    }

    if (!/[a-z]/.test(password)) {
      console.error("Senha deve conter pelo menos uma letra minúscula");
      return false;
    }

    console.log("Senha atende à política da empresa ✓");
    return true;
  }

  constructor() {
    // Verificar se a URL é SSL
    const isSSL = process.env.LDAP_URL?.startsWith("ldaps://");

    this.client = new Client({
      url: process.env.LDAP_URL,
      // Adicionar configurações de TLS se necessário
      ...(isSSL && {
        tlsOptions: {
          rejectUnauthorized: false, // Para desenvolvimento - em produção configure certificados adequados
          minVersion: "TLSv1.2",
        },
      }),
    });
    this.prisma = new PrismaClient();
  }

  async resetUserPasswordSSL(
    username: string,
    newPassword?: string,
  ): Promise<{
    success: boolean;
    message?: string;
    newPassword?: string;
  }> {
    if (!username || typeof username !== "string") {
      console.error("Nome de usuário inválido:", username);
      return { success: false, message: "Nome de usuário inválido" };
    }

    // Criar cliente específico para reset de senha com SSL forçado
    const sslClient = new Client({
      url: process.env.LDAP_URL?.replace("ldap://", "ldaps://").replace(
        ":389",
        ":636",
      ),
      tlsOptions: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      },
    });

    let isBound = false;
    const generatedPassword = newPassword || this.generateSecurePassword();

    try {
      if (!this.validatePasswordPolicy(generatedPassword)) {
        return {
          success: false,
          message: "Senha não atende aos requisitos de política do AD",
        };
      }

      console.log(
        `🔐 Conectando via SSL para resetar senha do usuário: ${username}`,
      );

      await sslClient.bind(
        process.env.LDAP_USERNAME,
        process.env.LDAP_PASSWORD,
      );
      isBound = true;
      console.log("✅ Conexão SSL estabelecida");

      // Buscar usuário
      const filter = `(&(objectClass=user)(sAMAccountName=${username}))`;
      const { searchEntries } = await sslClient.search(
        process.env.LDAP_BASE_DN,
        {
          filter,
          scope: "sub",
          attributes: ["dn", "userAccountControl"],
        },
      );

      if (!searchEntries || searchEntries.length === 0) {
        return { success: false, message: "Usuário não encontrado" };
      }

      const userDn = searchEntries[0].dn;
      console.log(`🎯 Usuário encontrado: ${userDn}`);

      // Reset de senha usando unicodePwd com SSL
      const encodedPassword = this.encodePasswordForAD(generatedPassword);

      const change = new Change({
        operation: "replace",
        modification: new Attribute({
          type: "unicodePwd",
          values: [encodedPassword],
        }),
      });

      await sslClient.modify(userDn, [change]);
      console.log("✅ Senha resetada com sucesso via SSL");

      // Remover obrigatoriedade de mudança (pode estar causando problema)
      try {
        const pwdChange = new Change({
          operation: "replace",
          modification: new Attribute({
            type: "pwdLastSet",
            values: ["-1"], // -1 = não forçar mudança
          }),
        });
        await sslClient.modify(userDn, [pwdChange]);
        console.log("✅ Configuração de senha ajustada");
      } catch (pwdError) {
        console.warn(
          "⚠️ Não foi possível ajustar pwdLastSet:",
          pwdError.message,
        );
      }

      return {
        success: true,
        message: "Senha resetada com sucesso via SSL",
        newPassword: generatedPassword,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`💥 Erro no reset SSL: ${errorMessage}`);

      return {
        success: false,
        message: `Erro no reset SSL: ${errorMessage}`,
      };
    } finally {
      if (isBound) {
        try {
          await sslClient.unbind();
          console.log("🔒 Conexão SSL encerrada");
        } catch (unbindError) {
          console.error("⚠️ Erro ao fechar SSL:", unbindError);
        }
      }
    }
  }

  private extractNameFromDn(dn: unknown): string {
    if (!dn) return "";

    let dnString = "";
    if (typeof dn === "string") {
      dnString = dn;
    } else if (Array.isArray(dn)) {
      dnString = typeof dn[0] === "string" ? dn[0] : dn[0].toString();
    } else if (dn instanceof Buffer) {
      dnString = dn.toString();
    } else {
      return "";
    }

    const cnPart = dnString.split(",").find((part) => part.startsWith("CN="));
    if (!cnPart) return dnString;

    return cnPart.substring(3);
  }

  private formatDnToFriendlyPath(dn: string): string {
    if (!dn) return "";

    const parts = dn
      .split(",")
      .filter((part) => !part.startsWith("DC="))
      .map((part) => {
        const equalPos = part.indexOf("=");
        return equalPos > -1 ? part.substring(equalPos + 1) : part;
      });

    const reversed = parts.reverse();

    return reversed.join("/");
  }

  async testAuthentication(
    username: string,
    password: string,
  ): Promise<{
    success: boolean;
    message?: string;
    userInfo?: any;
    authTime?: number;
    error?: string;
    debugInfo?: any;
  }> {
    if (!username || typeof username !== "string") {
      console.error("Nome de usuário inválido:", username);
      return { success: false, message: "Nome de usuário inválido" };
    }

    if (!password || typeof password !== "string") {
      console.error("Senha inválida");
      return { success: false, message: "Senha inválida" };
    }

    // Criar cliente separado para teste de autenticação
    const testClient = new Client({
      url: process.env.LDAP_URL,
    });

    const startTime = Date.now();
    let authTime = 0;
    const debugInfo: any = {};

    try {
      console.log(`🔍 Testando autenticação para usuário: ${username}`);
      console.log(`🔗 LDAP URL: ${process.env.LDAP_URL}`);

      // Primeiro, buscar o DN completo do usuário
      console.log("📡 Conectando com credenciais administrativas...");
      await testClient.bind(
        process.env.LDAP_USERNAME,
        process.env.LDAP_PASSWORD,
      );
      console.log("✅ Conexão administrativa estabelecida");

      const filter = `(&(objectClass=user)(sAMAccountName=${username}))`;
      const attributes = [
        "dn",
        "sAMAccountName",
        "userPrincipalName",
        "displayName",
        "userAccountControl",
        "lastLogon",
        "pwdLastSet",
        "accountExpires",
        "lockoutTime",
      ];

      console.log(`🔎 Buscando usuário com filtro: ${filter}`);
      const { searchEntries } = await testClient.search(
        process.env.LDAP_BASE_DN,
        {
          filter,
          scope: "sub",
          attributes,
        },
      );

      if (!searchEntries || searchEntries.length === 0) {
        console.warn(`❌ Usuário "${username}" não encontrado no LDAP`);
        return {
          success: false,
          message: "Usuário não encontrado",
          debugInfo: { filter, baseDN: process.env.LDAP_BASE_DN },
        };
      }

      const userEntry = searchEntries[0];
      const userDn = userEntry.dn;

      console.log(`👤 Usuário encontrado: ${userDn}`);
      debugInfo.userDn = userDn;
      debugInfo.userPrincipalName = userEntry.userPrincipalName;

      if (!userDn) {
        console.error(`❌ DN não encontrado para o usuário ${username}`);
        return { success: false, message: "DN do usuário não encontrado" };
      }

      // Verificar estado da conta em detalhes
      const userAccountControl = parseInt(
        userEntry.userAccountControl as string,
        10,
      );

      debugInfo.userAccountControl = userAccountControl;

      const ADS_UF_ACCOUNTDISABLE = 2;
      const ADS_UF_LOCKOUT = 16;
      const ADS_UF_PASSWORD_EXPIRED = 8388608;

      console.log(`🔍 userAccountControl: ${userAccountControl}`);

      if (
        (userAccountControl & ADS_UF_ACCOUNTDISABLE) ===
        ADS_UF_ACCOUNTDISABLE
      ) {
        console.warn(`❌ Conta desabilitada (UAC: ${userAccountControl})`);
        return {
          success: false,
          message: "Conta de usuário está desabilitada",
          debugInfo,
        };
      }

      if ((userAccountControl & ADS_UF_LOCKOUT) === ADS_UF_LOCKOUT) {
        console.warn(`❌ Conta bloqueada (UAC: ${userAccountControl})`);
        return {
          success: false,
          message: "Conta de usuário está bloqueada",
          debugInfo,
        };
      }

      // Verificar se a conta expirou
      if (
        userEntry.accountExpires &&
        userEntry.accountExpires !== "0" &&
        userEntry.accountExpires !== "9223372036854775807"
      ) {
        const expireDate = new Date(
          Number(userEntry.accountExpires) / 10000 - 11644473600000,
        );
        if (expireDate < new Date()) {
          console.warn(`❌ Conta expirada em: ${expireDate}`);
          return {
            success: false,
            message: "Conta de usuário expirada",
            debugInfo: { ...debugInfo, accountExpires: expireDate },
          };
        }
      }

      console.log("✅ Verificações de conta passaram");

      // Fechar a conexão administrativa
      await testClient.unbind();
      console.log("🔒 Conexão administrativa fechada");

      // Tentar múltiplos formatos de autenticação
      const authFormats = [
        userDn, // DN completo
        String(userEntry.sAMAccountName), // sAMAccountName
        String(userEntry.userPrincipalName), // UPN
        `${process.env.LDAP_DOMAIN}\\${username}`, // DOMAIN\username (se aplicável)
      ].filter((format) => format && format !== "undefined");

      console.log(
        `🔐 Tentando autenticação com ${authFormats.length} formatos diferentes...`,
      );

      for (let i = 0; i < authFormats.length; i++) {
        const authFormat = authFormats[i];
        console.log(`🔑 Tentativa ${i + 1}: ${authFormat}`);

        try {
          const authStartTime = Date.now();
          await testClient.bind(authFormat, password);
          authTime = Date.now() - authStartTime;

          console.log(
            `✅ Autenticação bem-sucedida com formato: ${authFormat} em ${authTime}ms`,
          );

          // Obter informações do usuário após autenticação bem-sucedida
          const userInfo = {
            username: String(userEntry.sAMAccountName),
            email: String(userEntry.userPrincipalName),
            displayName: String(userEntry.displayName),
            dn: String(userDn),
            accountStatus: "Ativo",
            authFormat: authFormat,
            lastPasswordSet: userEntry.pwdLastSet
              ? new Date(Number(userEntry.pwdLastSet) / 10000 - 11644473600000)
              : null,
          };

          return {
            success: true,
            message: "Autenticação realizada com sucesso",
            userInfo: userInfo,
            authTime: authTime,
            debugInfo: { ...debugInfo, successfulAuthFormat: authFormat },
          };
        } catch (authError) {
          const authErrorMessage =
            authError instanceof Error ? authError.message : String(authError);
          console.log(`❌ Falha na tentativa ${i + 1}: ${authErrorMessage}`);

          // Se é a última tentativa, vamos analisar o erro em detalhes
          if (i === authFormats.length - 1) {
            console.error(
              `💥 Todas as tentativas de autenticação falharam. Último erro: ${authErrorMessage}`,
            );

            let specificMessage = "Falha na autenticação";
            let errorType = "AUTH_FAILED";

            if (
              authErrorMessage.includes("INVALID_CREDENTIALS") ||
              authErrorMessage.includes("49")
            ) {
              specificMessage = "Credenciais inválidas - senha incorreta";
              errorType = "INVALID_PASSWORD";
            } else if (
              authErrorMessage.includes("NO_SUCH_OBJECT") ||
              authErrorMessage.includes("32")
            ) {
              specificMessage = "Usuário não encontrado no Active Directory";
              errorType = "USER_NOT_FOUND";
            } else if (
              authErrorMessage.includes("ACCOUNT_LOCKED") ||
              authErrorMessage.includes("775")
            ) {
              specificMessage = "Conta de usuário está bloqueada";
              errorType = "ACCOUNT_LOCKED";
            } else if (
              authErrorMessage.includes("PASSWORD_EXPIRED") ||
              authErrorMessage.includes("532")
            ) {
              specificMessage = "Senha expirada";
              errorType = "PASSWORD_EXPIRED";
            } else if (
              authErrorMessage.includes("ACCOUNT_DISABLED") ||
              authErrorMessage.includes("533")
            ) {
              specificMessage = "Conta de usuário está desabilitada";
              errorType = "ACCOUNT_DISABLED";
            } else if (authErrorMessage.includes("LDAP_STRONG_AUTH_REQUIRED")) {
              specificMessage = "Autenticação forte requerida (SSL/TLS)";
              errorType = "STRONG_AUTH_REQUIRED";
            }

            debugInfo.lastError = authErrorMessage;
            debugInfo.attemptedFormats = authFormats;

            return {
              success: false,
              message: specificMessage,
              error: errorType,
              authTime: Date.now() - startTime,
              debugInfo,
            };
          }
        }
      }
    } catch (error) {
      authTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `💥 Erro geral na autenticação do usuário "${username}":`,
        errorMessage,
      );

      debugInfo.generalError = errorMessage;

      return {
        success: false,
        message: `Erro geral: ${errorMessage}`,
        error: "GENERAL_ERROR",
        authTime: authTime,
        debugInfo,
      };
    } finally {
      try {
        await testClient.unbind();
        console.log("🔒 Conexão de teste encerrada");
      } catch (unbindError) {
        console.error("⚠️ Erro ao fechar conexão de teste:", unbindError);
      }
    }
  }
  async getUserInfo(username: string) {
    try {
      console.log("Conectando ao servidor LDAP...");
      await this.client.bind(
        process.env.LDAP_USERNAME,
        process.env.LDAP_PASSWORD,
      );
      console.log("Conectado ao servidor LDAP");
      console.log("Buscando usuário:", username);
      const filter = `(&(objectClass=user)(sAMAccountName=${username}*))`;
      const { searchEntries } = await this.client.search(
        process.env.LDAP_BASE_DN,
        {
          filter,
          scope: "sub",
        },
      );

      const userEntry = searchEntries[0];

      console.log("Search Entries:", searchEntries);
      const friendlyPath = this.formatDnToFriendlyPath(userEntry.dn);
      const friendlyManager = this.extractNameFromDn(userEntry.manager);

      const response = {
        ...searchEntries[0],
        dn: friendlyPath,
        manager: friendlyManager,
      };

      return response;
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return null;
    }
  }

  async resetUserPassword(
    username: string,
    newPassword?: string,
  ): Promise<{
    success: boolean;
    message?: string;
    newPassword?: string;
  }> {
    if (!username || typeof username !== "string") {
      console.error("Nome de usuário inválido:", username);
      return { success: false, message: "Nome de usuário inválido" };
    }

    let isBound = false;
    const generatedPassword = newPassword || this.generateSecurePassword();

    try {
      if (!this.validatePasswordPolicy(generatedPassword)) {
        return {
          success: false,
          message: "Senha não atende aos requisitos de política do AD",
        };
      }

      console.log(
        `🔄 Conectando ao servidor LDAP para resetar senha do usuário: ${username}`,
      );
      await this.client.bind(
        process.env.LDAP_USERNAME,
        process.env.LDAP_PASSWORD,
      );
      isBound = true;
      console.log("✅ Conexão LDAP estabelecida");

      // Buscar usuário
      const filter = `(&(objectClass=user)(sAMAccountName=${username}))`;
      const attributes = [
        "dn",
        "sAMAccountName",
        "userPrincipalName",
        "userAccountControl",
      ];

      const { searchEntries } = await this.client.search(
        process.env.LDAP_BASE_DN,
        {
          filter,
          scope: "sub",
          attributes,
        },
      );

      if (!searchEntries || searchEntries.length === 0) {
        console.warn(`❌ Usuário "${username}" não encontrado no LDAP`);
        return { success: false, message: "Usuário não encontrado" };
      }

      const userEntry = searchEntries[0];
      const userDn = userEntry.dn;

      if (!userDn) {
        console.error(`❌ DN não encontrado para o usuário ${username}`);
        return { success: false, message: "DN do usuário não encontrado" };
      }

      const userAccountControl = parseInt(
        userEntry.userAccountControl as string,
        10,
      );
      const ADS_UF_ACCOUNTDISABLE = 2;
      if (
        (userAccountControl & ADS_UF_ACCOUNTDISABLE) ===
        ADS_UF_ACCOUNTDISABLE
      ) {
        return {
          success: false,
          message: "Não é possível resetar senha de usuário desabilitado",
        };
      }

      console.log(`🔐 Resetando senha para o usuário: ${username}`);
      console.log(`📍 DN do usuário: ${userDn}`);
      console.log(`🆔 UserAccountControl: ${userAccountControl}`);

      // MÉTODO 1: Tentar com unicodePwd (método padrão do AD)
      try {
        console.log("🔑 Método 1: Tentando com unicodePwd...");
        const encodedPassword = this.encodePasswordForAD(generatedPassword);

        const changeUnicode = new Change({
          operation: "replace",
          modification: new Attribute({
            type: "unicodePwd",
            values: [encodedPassword],
          }),
        });

        await this.client.modify(userDn, [changeUnicode]);
        console.log("✅ Senha resetada com sucesso usando unicodePwd");
      } catch (unicodeError) {
        console.log(`❌ Método 1 falhou: ${unicodeError.message}`);

        // MÉTODO 2: Tentar com userPassword como fallback
        try {
          console.log("🔑 Método 2: Tentando com userPassword...");
          const changePlain = new Change({
            operation: "replace",
            modification: new Attribute({
              type: "userPassword",
              values: [generatedPassword],
            }),
          });

          await this.client.modify(userDn, [changePlain]);
          console.log("✅ Senha resetada com sucesso usando userPassword");
        } catch (plainError) {
          console.log(`❌ Método 2 falhou: ${plainError.message}`);

          // MÉTODO 3: Tentar delete + add com unicodePwd
          try {
            console.log("🔑 Método 3: Tentando delete + add...");

            const deleteChange = new Change({
              operation: "delete",
              modification: new Attribute({
                type: "unicodePwd",
                values: [],
              }),
            });

            const addChange = new Change({
              operation: "add",
              modification: new Attribute({
                type: "unicodePwd",
                values: [this.encodePasswordForAD(generatedPassword)],
              }),
            });

            await this.client.modify(userDn, [deleteChange, addChange]);
            console.log("✅ Senha resetada com sucesso usando delete + add");
          } catch (deleteAddError) {
            console.log(`❌ Método 3 falhou: ${deleteAddError.message}`);
            throw new Error(
              `Todos os métodos de reset falharam. Último erro: ${deleteAddError.message}`,
            );
          }
        }
      }

      // Opcional: Forçar mudança de senha no próximo logon
      try {
        console.log("🔄 Configurando para forçar mudança no próximo logon...");
        const forceChangePasswordChange = new Change({
          operation: "replace",
          modification: new Attribute({
            type: "pwdLastSet",
            values: ["0"],
          }),
        });
        await this.client.modify(userDn, [forceChangePasswordChange]);
        console.log(
          "✅ Usuário será obrigado a alterar a senha no próximo logon",
        );
      } catch (pwdLastSetError) {
        console.warn(
          "⚠️ Aviso: Não foi possível forçar mudança de senha no próximo logon:",
          pwdLastSetError.message,
        );
      }

      return {
        success: true,
        message: "Senha resetada com sucesso",
        newPassword: generatedPassword,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `💥 Falha ao resetar senha do usuário "${username}":`,
        errorMessage,
      );

      let userFriendlyMessage = "Erro desconhecido ao resetar senha";

      if (errorMessage.includes("INSUFFICIENT_ACCESS")) {
        userFriendlyMessage = "Permissões insuficientes para alterar senha";
      } else if (errorMessage.includes("CONSTRAINT_VIOLATION")) {
        userFriendlyMessage = "Senha não atende aos requisitos de política";
      } else if (errorMessage.includes("NO_SUCH_OBJECT")) {
        userFriendlyMessage = "Usuário não encontrado no Active Directory";
      } else if (errorMessage.includes("INVALID_CREDENTIALS")) {
        userFriendlyMessage = "Credenciais de conexão LDAP inválidas";
      } else if (errorMessage.includes("WILL_NOT_PERFORM")) {
        userFriendlyMessage =
          "Operação não permitida - verifique SSL/TLS e permissões";
      }

      return {
        success: false,
        message: userFriendlyMessage,
      };
    } finally {
      if (isBound) {
        try {
          await this.client.unbind();
          console.log("🔒 Conexão LDAP encerrada");
        } catch (unbindError) {
          console.error(
            "⚠️ Erro ao desconectar do LDAP:",
            unbindError instanceof Error ? unbindError.message : unbindError,
          );
        }
      }
    }
  }
  async deactivateUser(username: string): Promise<boolean> {
    if (!username || typeof username !== "string") {
      console.error("Nome de usuário inválido:", username);
      return false;
    }

    let isBound = false;

    try {
      // Conectar ao LDAP
      console.log(
        `Conectando ao servidor LDAP para desativar usuário: ${username}`,
      );
      await this.client.bind(
        process.env.LDAP_USERNAME,
        process.env.LDAP_PASSWORD,
      );
      isBound = true;
      console.log("Conexão LDAP estabelecida");

      // Buscar usuário
      const filter = `(&(objectClass=user)(sAMAccountName=${username}))`;
      const attributes = ["userAccountControl", "dn"];

      const { searchEntries } = await this.client.search(
        process.env.LDAP_BASE_DN,
        {
          filter,
          scope: "sub",
          attributes,
        },
      );

      if (!searchEntries || searchEntries.length === 0) {
        console.warn(`Usuário "${username}" não encontrado no LDAP`);
        return false;
      }

      const userEntry = searchEntries[0];
      const userDn = userEntry.dn;

      if (!userDn) {
        console.error(`DN não encontrado para o usuário ${username}`);
        return false;
      }

      const currentUAC = parseInt(userEntry.userAccountControl as string, 10);
      const ADS_UF_ACCOUNTDISABLE = 2;
      const isAlreadyDisabled =
        (currentUAC & ADS_UF_ACCOUNTDISABLE) === ADS_UF_ACCOUNTDISABLE;

      if (isAlreadyDisabled) {
        console.log(
          `Usuário "${username}" já está desativado (userAccountControl=${currentUAC})`,
        );
        return true;
      }

      const newUAC = currentUAC | ADS_UF_ACCOUNTDISABLE;
      console.log(
        `Atualizando userAccountControl de ${currentUAC} para ${newUAC} para o usuário ${username}`,
      );

      const change = new Change({
        operation: "replace",
        modification: new Attribute({
          type: "userAccountControl",
          values: [String(newUAC)],
        }),
      });

      console.log("Alteração:", change);
      return true;

      await this.client.modify(userDn, [change]);
      console.log(`Usuário "${username}" desativado com sucesso`);
      return true;
    } catch (error) {
      console.error(
        `Falha ao desativar usuário "${username}":`,
        error instanceof Error ? error.message : error,
      );
      return false;
    } finally {
      if (isBound) {
        try {
          await this.client.unbind();
          console.log("Conexão LDAP encerrada");
        } catch (unbindError) {
          console.error(
            "Erro ao desconectar do LDAP:",
            unbindError instanceof Error ? unbindError.message : unbindError,
          );
        }
      }
    }
  }

  async deactivateUserByDescription(issue: any): Promise<boolean> {
    const cleanedCpf = issue.cpf.replace(/\D/g, "");
    if (!cleanedCpf || typeof cleanedCpf !== "string") {
      console.error("CPF inválido:", issue.cpf);
      return false;
    }

    let isBound = false;
    let userEntry: any = null;
    let department = "";
    let organizationalUnit = "";
    let errorMessage = "";

    try {
      // Conectar ao LDAP
      console.log(
        `Conectando ao servidor LDAP para desativar usuário: ${cleanedCpf}`,
      );
      await this.client.bind(
        process.env.LDAP_USERNAME,
        process.env.LDAP_PASSWORD,
      );
      isBound = true;
      console.log("Conexão LDAP estabelecida");

      // Buscar usuário
      const filter = `(&(objectClass=user)(description=${cleanedCpf}*))`;
      const attributes = [
        "userAccountControl",
        "dn",
        "sAMAccountName",
        "userPrincipalName",
        "description",
        "l",
        "st",
        "c",
        "name",
      ];

      const { searchEntries } = await this.client.search(
        process.env.LDAP_BASE_DN,
        {
          filter,
          scope: "sub",
          attributes,
        },
      );

      if (!searchEntries || searchEntries.length === 0) {
        console.warn(`Usuário "${cleanedCpf}" não encontrado no LDAP`);
        return false;
      }

      userEntry = searchEntries[0];
      const userDn = userEntry.dn;

      // Extrair department e organizational_unit do DN do usuário
      if (userDn) {
        const dnParts = userDn.split(",");
        const ouParts = dnParts.filter((part) => part.trim().startsWith("OU="));
        if (ouParts.length >= 3) {
          department = ouParts[0].substring(3);
          organizationalUnit = ouParts[1].substring(3);
          console.log(
            `Extraído: Department=${department}, OrganizationalUnit=${organizationalUnit}`,
          );
        }
      }

      if (!userDn) {
        console.error(`DN não encontrado para o usuário ${cleanedCpf}`);
        return false;
      }

      const currentUAC = parseInt(userEntry.userAccountControl as string, 10);
      const ADS_UF_ACCOUNTDISABLE = 2;
      const isAlreadyDisabled =
        (currentUAC & ADS_UF_ACCOUNTDISABLE) === ADS_UF_ACCOUNTDISABLE;

      if (isAlreadyDisabled) {
        console.log(
          `Usuário "${userEntry.sAMAccountName}" já está desativado (userAccountControl=${currentUAC})`,
        );
        return true;
      }

      const newUAC = currentUAC | ADS_UF_ACCOUNTDISABLE;
      console.log(
        `Atualizando userAccountControl de ${currentUAC} para ${newUAC} para o usuário ${userEntry.sAMAccountName}`,
      );

      const change = new Change({
        operation: "replace",
        modification: new Attribute({
          type: "userAccountControl",
          values: [String(newUAC)],
        }),
      });

      console.log("Alteração:", change);

      await this.client.modify(userDn, [change]);
      console.log(`Usuário "${cleanedCpf}" desativado com sucesso`);

      // Registra no banco de dados com status de sucesso
      await this.prisma.offboarding.create({
        data: {
          issue_key: issue.issueKey,
          issue_id: parseInt(issue.issueId),
          full_name:
            this.extractNameFromDn(userEntry.name) || String(userEntry.name),
          user_name: String(userEntry.sAMAccountName),
          email: String(userEntry.userPrincipalName),
          password: "password",
          description: String(userEntry.description),
          department: department,
          organizational_unit: organizationalUnit,
          city: String(userEntry.l),
          state: String(userEntry.st),
          country: String(userEntry.c),
          status: "Sucesso",
          error_message: "",
        },
      });

      return true;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `Falha ao desativar usuário "${cleanedCpf}":`,
        errorMessage,
      );

      if (userEntry) {
        await this.prisma.offboarding.create({
          data: {
            issue_key: issue.issueKey,
            issue_id: parseInt(issue.issueId),
            full_name:
              this.extractNameFromDn(userEntry.name) || String(userEntry.name),
            user_name: String(userEntry.sAMAccountName),
            email: String(userEntry.userPrincipalName),
            password: "password",
            description: String(userEntry.description),
            department: department,
            organizational_unit: organizationalUnit,
            city: String(userEntry.l),
            state: String(userEntry.st),
            country: String(userEntry.c),
            status: "Falha",
            error_message: errorMessage,
          },
        });
      }

      return false;
    } finally {
      if (isBound) {
        try {
          await this.client.unbind();
          console.log("Conexão LDAP encerrada");
        } catch (unbindError) {
          console.error(
            "Erro ao desconectar do LDAP:",
            unbindError instanceof Error ? unbindError.message : unbindError,
          );
        }
      }
    }
  }

  async createUser(userInfo: any) {
    console.log("Criando usuário: ", userInfo);
    try {
      console.log("Conectando ao servidor LDAP...");
      await this.client.bind(
        process.env.LDAP_USERNAME,
        process.env.LDAP_PASSWORD,
      );
      console.log("Conectado ao servidor LDAP");

      const newUser = {
        cn: userInfo.fullName,
        sn: userInfo.lastName,
        uid: userInfo.lastName,
        givenName: userInfo.firstName,
        displayName: userInfo.fullName,
        name: userInfo.fullName,
        userPrincipalName: userInfo.email,
        sAMAccountName: userInfo.sAMAccountName,
        description: userInfo.description,
        company: userInfo.company,
        manager: userInfo.manager,
        st: userInfo.st,
        l: userInfo.l,
        c: "BR",
        title: userInfo.title,
        department: userInfo.department,
        objectclass: ["User", "top", "person", "organizationalPerson"],
        userAccountControl: "544",
        userPassword: userInfo.userPass,
      };

      // Gera combinações de usuários
      newUser.sAMAccountName = await this.gerarUsernameUnico(
        userInfo.splitName,
      );
      newUser.userPrincipalName = `${newUser.sAMAccountName}@alaresinternet.com.br`;

      const manager = await this.buscarGestor(userInfo.manager);
      newUser.manager = manager;

      const newUserDN = `CN=${newUser.cn},OU=${newUser.department},OU=${userInfo.organizationalUnit},OU=Usuarios,dc=GRUPOCONEXAO,dc=com,dc=br`;

      // Criação do usuário no LDAP
      await this.client.add(newUserDN, newUser);
      console.log("Usuário criado:", newUser);

      // Registra no banco de dados com status de sucesso
      await this.prisma.onboarding.create({
        data: {
          issue_key: userInfo.issueKey,
          issue_id: parseInt(userInfo.issueId),
          full_name: newUser.name,
          user_name: newUser.sAMAccountName,
          email: newUser.userPrincipalName,
          password: newUser.userPassword,
          description: newUser.description,
          department: newUser.department,
          organizational_unit: userInfo.organizationalUnit,
          city: newUser.l,
          state: newUser.st,
          country: newUser.c,
          status: "Sucesso",
          error_message: "",
        },
      });
      return newUser;
    } catch (error) {
      console.error("Erro ao criar usuário:", error);

      // Mensagem genérica de erro ao criar o usuário
      let errorMessage = "Erro desconhecido ao criar usuário.";

      // Tratar erro de conexão fechada
      if (
        error.message &&
        error.message.includes(
          "Connection closed before message response was received",
        )
      ) {
        errorMessage =
          "A conexão com o servidor LDAP foi fechada antes da resposta ser recebida.";
      } else if (error instanceof Error) {
        if (
          error.name === "AlreadyExistsError" ||
          error.message.includes("ENTRY_EXISTS")
        ) {
          errorMessage = "Usuário já existe no LDAP.";
        } else if (
          error.name === "NoSuchObjectError" ||
          error.message.includes("NO_SUCH_OBJECT")
        ) {
          errorMessage = "Organizational Unit (OU) não existe no LDAP.";
        } else if (
          error.name === "InsufficientAccessError" ||
          error.message.includes("INSUFFICIENT_ACCESS")
        ) {
          errorMessage = "Permissões insuficientes para criar usuário no LDAP.";
        } else if (
          error.name === "ServerDownError" ||
          error.message.includes("SERVER_DOWN")
        ) {
          errorMessage = "Servidor LDAP está inacessível.";
        } else if (
          error.name === "BusyError" ||
          error.message.includes("BUSY")
        ) {
          errorMessage = "Servidor LDAP está ocupado. Tente novamente.";
        }
      }

      // Função para tratar strings antes de inserir no banco de dados
      function sanitizeString(input: string): string {
        if (!input) return "";
        return input.replace(/\u0000/g, "");
      }

      try {
        await this.prisma.onboarding.create({
          data: {
            issue_key: sanitizeString(userInfo.issueKey),
            issue_id: parseInt(userInfo.issueId),
            full_name: sanitizeString(userInfo.fullName),
            user_name: sanitizeString(userInfo.sAMAccountName),
            email: sanitizeString(userInfo.email),
            password: sanitizeString(userInfo.userPass),
            description: sanitizeString(userInfo.description),
            department: sanitizeString(userInfo.department),
            organizational_unit: sanitizeString(userInfo.organizationalUnit),
            city: sanitizeString(userInfo.l),
            state: sanitizeString(userInfo.st),
            country: sanitizeString(userInfo.c),
            status: "Falha",
            error_message: sanitizeString(errorMessage),
          },
        });
        console.log("Erro registrado com sucesso no banco de dados");
      } catch (dbError) {
        console.error("Falha ao registrar erro no banco de dados:", dbError);
      }
      throw error;
    } finally {
      await this.client.unbind();
    }
  }

  private async gerarUsernameUnico(splitName: string[]): Promise<string> {
    const combinacoes = this.gerarCombinacoes(splitName);

    console.log("Combinações de usuários:", combinacoes);
    for (const username of combinacoes) {
      console.log("Tentando username: ", username);
      const existe = await this.usuarioExiste(username);
      if (!existe) {
        return username;
      }
    }

    throw new Error("Não foi possível gerar um nome de usuário único.");
  }

  private gerarCombinacoes(splitName: string[]): string[] {
    const combinacoes: string[] = [];
    console.log("splitName: ", splitName);

    if (splitName.length < 2) {
      console.error("Erro: O nome precisa ter pelo menos dois nomes.");
      return [];
    }

    const primeiroNome = splitName[0].toLowerCase();

    for (let i = splitName.length - 1; i > 0; i--) {
      const nomeCombinado = `${primeiroNome}.${splitName[i].toLowerCase()}`;
      combinacoes.push(nomeCombinado);
    }

    console.log("Combinacoes geradas: ", combinacoes);

    return combinacoes;
  }

  private async usuarioExiste(username: string): Promise<boolean> {
    if (!username) {
      console.error("Erro: username recebido é undefined ou null!");
      return false;
    }

    const sAMAccountName = username.toString();

    const filter = `(&(objectClass=user)(sAMAccountName=${sAMAccountName}*))`;

    try {
      console.log("entrei no search");
      const { searchEntries } = await this.client.search(
        process.env.LDAP_BASE_DN,
        {
          filter,
          scope: "sub",
        },
      );

      return searchEntries.length > 0;
    } catch (error) {
      console.error("Erro ao verificar se o usuário existe:", error);
      return false;
    }
  }

  private async buscarGestor(manager: string): Promise<string> {
    if (!manager) {
      console.error("Erro: Gestor recebido é undefined ou null!");
      return "";
    }

    const sAMAccountName = manager.toString();
    const filter = `(&(objectClass=user)(sAMAccountName=${sAMAccountName}*))`;

    try {
      console.log("entrei no search");
      const { searchEntries } = await this.client.search(
        process.env.LDAP_BASE_DN,
        {
          filter,
          scope: "sub",
        },
      );
      const managerDN = searchEntries[0].dn;
      console.log("Search Entries:", searchEntries);
      return managerDN;
    } catch (error) {
      console.error("Erro ao verificar se o usuário existe:", error);
      return "";
    }
  }
}
