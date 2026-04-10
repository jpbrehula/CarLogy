import database from "infra/database.js";
// Importo só o InternalServerError porque este arquivo só trata erro 500.
// Evito importar "errors" inteiro para manter claro quais erros são usados aqui
// e evitar dependências desnecessárias.
import { InternalServerError } from "infra/errors";

async function status(request, response) {
  try {
    //  Data de atualização da API
    const updatedAt = new Date().toISOString();

    // Pergunta ao Postgress QUAL É A VERSÃO
    const databaseVersionResult = await database.query("SHOW server_version;");
    const databaseVersion = databaseVersionResult.rows[0].server_version;

    // Pergunta ao Postgress QUAL É O MAXIMO DE CONEXÕES
    const maxConnectionsResult = await database.query("SHOW max_connections;");
    const maxConnections = Number(maxConnectionsResult.rows[0].max_connections);

    //pergunta ao Postgress QUANTAS CONEXÕES ESTÃO SENDO USADAS AGORA
    const usedConnectionResult = await database.query(`
    SELECT count (*)
    FROM pg_stat_activity
    WHERE datname = current_Database();
    `);

    const usedConnections = Number(usedConnectionResult.rows[0].count);

    // Retorno do JSON
    response.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          version: databaseVersion,
          max_connections: maxConnections,
          used_connections: usedConnections,
        },
      },
    });
  } catch (error) {
    const publicErrorObject = new InternalServerError({
      cause: error,
    });

    console.log("\n Erro dentro do catch do controller:");
    console.error(publicErrorObject);

    response.status(500).json(publicErrorObject);
  }
}

export default status;
