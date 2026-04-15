import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";

import database from "infra/database.js";
import { ServiceError } from "infra/errors.js";

// Configuração base compartilhada entre a listagem e a execução das migrations.
const defaultMigrationOptions = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  let dbClient;

  try {
    // Abre uma conexão dedicada para o runner inspecionar o estado atual do banco.
    dbClient = await database.getNewClient();

    const pendingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
    });

    return pendingMigrations;
  } catch (error) {
    throw new ServiceError({
      message: "Falha ao listar migrations pendentes com o migration runner.",
      cause: error,
    });
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;

  try {
    // Abre uma conexão dedicada para aplicar no banco as migrations ainda pendentes.
    dbClient = await database.getNewClient();

    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
      // Sobrescreve o dryRun padrão para executar as alterações de verdade.
      dryRun: false,
    });

    return migratedMigrations;
  } catch (error) {
    throw new ServiceError({
      message: "Falha ao executar migrations pendentes com o migration runner.",
      cause: error,
    });
  } finally {
    // Garante o fechamento da conexão mesmo se o runner lançar erro.
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
