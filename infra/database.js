import { Client } from "pg";

// Executa uma query e garante o encerramento da conexão.
async function query(queryObject) {
  let client;

  try {
    client = await getNewClient();
    return await client.query(queryObject);
  } catch (error) {
    console.error("\nErro ao executar query em database.js:");
    console.error(error);
    throw error;
  } finally {
    // Evita erro caso a conexão não tenha sido criada.
    await client?.end();
  }
}

// Cria e conecta um novo client com base nas variáveis de ambiente.
async function getNewClient() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: getSSLValues(),
  });

  await client.connect();
  return client;
}

// Define a configuração de SSL conforme o ambiente.
function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
    };
  }

  return process.env.NODE_ENV === "production";
}

const database = {
  query,
  getNewClient,
};

export default database;
