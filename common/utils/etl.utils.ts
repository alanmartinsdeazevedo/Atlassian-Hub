export interface ETLResult {
  issueId: number;
  issueKey: string;
  fullName: string;
  firstName: string;
  lastName: string;
  splitName: string[];
  description: string;
  title: string;
  department: string;
  organizationalUnit: string;
  company: string;
  manager: string;
  st: string;
  l: string;
  c: string;
  sAMAccountName: string;
  email: string;
  userPass: string;
  passB64: string;
}

export function ETL(
  issueId: number,
  issueKey: string,
  name: string,
  cpf: string,
  cargo: string,
  setor: string,
  departamento: string,
  gestor: string,
  cidade_uf: string,
): ETLResult {
  const maskDescription = mask();
  const fullName = name.trim();
  const preposicoes = ["de", "da", "do", "dos", "das", "e"];
  const description = cpf.replace(/\D/g, "") + maskDescription.toString();
  let splitName = fullName.split(" ");
  splitName = splitName.filter((part) => !preposicoes.includes(part));
  const ouSetor = setor;
  const ouDep = departamento;
  const firstName = splitName[0];
  const lastName = splitName[splitName.length - 1];
  const userName = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  const cleanedUserName = removeAccents(userName);
  const email = cleanedUserName + "@alaresinternet.com.br";
  const sAMAccountName = cleanedUserName.toString();
  const userPass = password();
  const passB64 = Buffer.from(userPass).toString("base64");
  const titleDirt = cargo.trim();
  const titleClean = removeAccents(titleDirt);
  const title = titleClean.toString();
  const organizationalUnit = transformOrganizationalUnit(ouSetor).toString();
  const department = transformDepartment(ouDep);
  const l = cidade_uf.split(" - ")[0];
  const st = cidade_uf.slice(-2).toString();
  const c = "Brasil";
  const company = "Alares";
  const manager = gestor.replace("@alaresinternet.com.br", "");

  return {
    issueId,
    issueKey,
    fullName,
    firstName,
    lastName,
    splitName,
    description,
    title,
    department,
    organizationalUnit,
    company,
    manager,
    st,
    l,
    c,
    sAMAccountName,
    email,
    userPass,
    passB64,
  };
}

function mask() {
  const numeroAleatorio = Math.floor(Math.random() * 1000);
  const digitos = numeroAleatorio.toString().padStart(3, "0");

  return digitos;
}

function removeAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function password() {
  const letrasMaiusculas = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const letrasMinusculas = "abcdefghijklmnopqrstuvwxyz";
  const numeros = "0123456789";
  const caracteresEspeciais = "@#!";

  const primeiraLetra =
    letrasMaiusculas[Math.floor(Math.random() * letrasMaiusculas.length)];

  const outrasLetras = [];
  for (let i = 0; i < 9; i++) {
    outrasLetras.push(
      letrasMinusculas[Math.floor(Math.random() * letrasMinusculas.length)],
    );
  }

  const numero = numeros[Math.floor(Math.random() * numeros.length)];

  const caractereEspecial =
    caracteresEspeciais[Math.floor(Math.random() * caracteresEspeciais.length)];

  const senha =
    primeiraLetra + outrasLetras.join("") + numero + caractereEspecial;

  return senha;
}

function transformOrganizationalUnit(ou) {
  const ouMap = {
    Atendimento: "ATENDIMENTO AO CLIENTE",
    Comercial: "COMERCIAL",
    Diretoria: "DIRETORIA",
    Finanças: "FINANCAS",
    Jurídico: "JURIDICO",
    Marketing: "MARKETING",
    Operação: "OPERACAO",
    "Recursos Humanos": "RECURSOS HUMANOS",
    Tecnologia: "TECNOLOGIA",
    TI: "TI",
  };
  return ouMap[ou] || ou;
}

function transformDepartment(dept) {
  const deptMap = {
    "CallCenter Atendimento": "CallCenter Atendimento",
    "CallCenter Relacionamento": "CallCenter Relacionamento",
    Relacionamento: "Relacionamento",
    Retenção: "Retencao",
    Showroom: "Showroom",
    "Administrador de Vendas": "Administ de Vendas",
    Vendas: "Vendas",
    "Vendas B2B": "Vendas B2B",
    "Vendas Telemarketing": "Vendas Telemarketing",
    Auditoria: "Auditoria",
    Diretores: "Diretores",
    "Gerencia Geral": "Gerencia Geral",
    Secretarias: "Secretarias",
    Administrativo: "Administrativo",
    Almoxerifado: "Almoxerifado",
    Cobrança: "Cobranca",
    Contabilidade: "Contabilidade",
    Financeiro: "Financeiro",
    "Gestão de Documentos": "Gestao de Documentos",
    "Não se aplica": "N/A",
    GRC: "GRC",
    "Limpeza e Conservação": "Limpeza e Conservacao",
    Portaria: "Portaria",
    Comunicação: "Comunicacao",
    CRM: "CRM",
    "Custumer Exp": "Custumer Exp",
    Digital: "Digital",
    "Growth e Produtos": "Growth e Produtos",
    Backoffice: "Backoffice",
    Instalação: "Instalacao",
    "Manutenção de Assinantes": "Manut Assinantes",
    Redes: "Redes",
    "Redes Construção": "Redes Construcao",
    "Administrativo Pessoal": "Administrativo Pessoal",
    "Administrativo Recursos Humanos": "Administrativo Recursos Humanos",
    "Cultura e Desenvolvimento": "Cultura e Desenvolvimento",
    "Desenvolvimento Organizacional": "Desenvolvimento Organizacional",
    "Gerência de Voz": "Gerencia de Voz",
    Headend: "Headend",
    NOC: "NOC",
    Projetos: "Projetos",
    Billing: "Billing",
    "Data Analytics": "Data Analytics",
    ERP: "ERP",
    Governança: "Governanca",
    Infraestrutura: "Infraestrutura",
    OSS: "OSS",
    Segurança: "Seguranca",
    "Service Desk": "Service Desk",
    Sistemas: "Sistemas",
  };
  return deptMap[dept] || dept;
}
