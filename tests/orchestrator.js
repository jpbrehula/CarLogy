import retry from "async-retry";
// Importa o módulo de banco (infra/database.js)
// Ele tem a função database.query(...) que executa SQL no PostgreSQL
import database from "infra/database.js";
import migrator from "models/migrator.js";

async function waitForAllServices() {
  await waitForWebServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");

      if (response.status !== 200) {
        throw Error();
      }
    }
  }
}

async function clearDatabase() {
  // Apaga completamente o schema public (tabelas, migrations table, etc)
  // e recria ele vazio
  // O "cascade" garante que tudo que depende do schema também é removido
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
};
export default orchestrator;
