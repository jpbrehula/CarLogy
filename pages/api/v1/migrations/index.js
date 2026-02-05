// Importa a função que executa migrations usando o banco PostgreSQL
// Essa lib sabe ler arquivos de migration e controlar o que já rodou
import migrationRunner from "node-pg-migrate";

// Importa a função join para montar caminhos de pastas
// Evita problemas de path entre sistemas (Windows, Mac, Linux)
import { join } from "node:path";

// Importa o módulo de banco de dados que você criou
// Ele fornece getNewClient() para abrir conexões com o banco
import database from "infra/database.js";

// Função principal do endpoint /api/v1/migrations
// request  -> representa a requisição HTTP (método, headers, etc)
// response -> representa a resposta HTTP que será enviada
export default async function migrations(request, response) {
  const allowedMethods = ["GET", "POST"];
  if (!allowedMethods.includes(request.method)) {
    return response.status(405).json({
      error: `Method "${request.method}"not allowed`,
    });
  }

  let dbClient;
  try {
    // Cria uma nova conexão com o banco de dados
    // Essa conexão será usada pelo node-pg-migrate
    dbClient = await database.getNewClient();

    // Configuração base das migrations
    // Essas opções serão usadas tanto no GET quanto no POST
    const defaultMigrationOptions = {
      // Cliente de banco que o node-pg-migrate vai usar
      dbClient: dbClient,

      // dryRun = true significa:
      // "simula as migrations, mas NÃO aplica no banco"
      dryRun: true,

      // Diretório onde estão os arquivos de migration
      dir: join("infra", "migrations"),

      // Direção das migrations
      // "up" = aplicar migrations pendentes
      direction: "up",

      // verbose = true mostra logs detalhados
      verbose: true,

      // Nome da tabela que controla quais migrations já rodaram
      migrationsTable: "pgmigrations",
    };

    // Se o método HTTP for GET
    if (request.method === "GET") {
      // Executa o migrationRunner em modo dryRun
      // Isso retorna apenas as migrations pendentes
      const pendingMigrations = await migrationRunner(defaultMigrationOptions);

      // Retorna status 200 (OK) com a lista de migrations pendentes
      return response.status(200).json(pendingMigrations);

      // Se o método HTTP for POST
    } else if (request.method === "POST") {
      // Executa o migrationRunner de verdade (dryRun = false)
      // Aqui as migrations são aplicadas no banco
      const migratedMigrations = await migrationRunner({
        ...defaultMigrationOptions,
        dryRun: false,
      });

      // Se alguma migration foi aplicada
      if (migratedMigrations.length > 0) {
        // Retorna 201 (Created)
        // Indica que algo novo foi criado/modificado no servidor
        return response.status(201).json(migratedMigrations);
      }

      // Se nenhuma migration foi aplicada
      // Retorna 200 (OK) com array vazio
      return response.status(200).json(migratedMigrations);

      // Se o método HTTP não for GET nem POST
    }
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    // Fecha a conexão com o banco
    await dbClient.end();
  }
}
