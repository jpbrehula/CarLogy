// Importa o Client do pacote "pg"
// Client representa uma conexão individual com o PostgreSQL
import { Client } from "pg";

// ======================================================
// Função de alto nível para executar QUALQUER query SQL
// Ela:
// 1. abre uma conexão
// 2. executa a query
// 3. retorna o resultado
// 4. garante que a conexão seja fechada
// ======================================================
async function query(queryObject) {
  let client;

  try {
    // Abre uma nova conexão com o banco
    // getNewClient encapsula toda a lógica de conexão
    client = await getNewClient();

    // Executa a query recebida como parâmetro
    // queryObject pode ser uma string SQL ou um objeto do pg
    const result = await client.query(queryObject);

    // Retorna o resultado da query para quem chamou
    return result;
  } catch (error) {
    // Loga o erro para debug
    // Útil em testes, CI, logs de produção, etc.
    console.error(error);

    // Relança o erro para que o nível acima decida o que fazer
    // Ex: API retorna 500, teste falha, etc.
    throw error;
  } finally {
    // SEMPRE fecha a conexão com o banco
    // O finally roda independentemente de sucesso ou erro
    await client.end();
  }
}

// ======================================================
// Função responsável APENAS por criar e conectar um client
// Ela não executa queries, só prepara a conexão
// ======================================================
async function getNewClient() {
  // Cria uma nova instância do Client do pg
  const client = new Client({
    // Host do banco (ex: localhost, Neon, Railway, etc)
    host: process.env.POSTGRES_HOST,

    // Porta do PostgreSQL (normalmente 5432)
    port: process.env.POSTGRES_PORT,

    // Usuário do banco
    user: process.env.POSTGRES_USER,

    // Nome do banco de dados
    database: process.env.POSTGRES_DB,

    // Senha do banco
    password: process.env.POSTGRES_PASSWORD,

    // Configuração de SSL decidida dinamicamente
    // A lógica fica isolada em getSSLValues()
    ssl: getSSLValues(),
  });

  // Abre efetivamente a conexão com o banco
  await client.connect();

  // Retorna o client já conectado
  return client;
}

// ======================================================
// Exporta as funções para serem usadas como:
// database.query(...)
// database.getNewClient()
// ======================================================
export default {
  query,
  getNewClient,
};

// ======================================================
// Função responsável por decidir como o SSL será usado
// Dependendo do ambiente (dev/prod) e das variáveis
// ======================================================
function getSSLValues() {
  // Se existir um certificado CA (ex: produção mais restrita)
  if (process.env.POSTGRES_CA) {
    return {
      // Certificado de autoridade usado para validar a conexão
      ca: process.env.POSTGRES_CA,
    };
  }

  // Se estiver em produção, ativa SSL
  // Se estiver em desenvolvimento, desativa SSL
  return process.env.NODE_ENV === "production" ? true : false;
}
