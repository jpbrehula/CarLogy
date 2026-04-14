import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";

import controller from "infra/controller.js";
import database from "infra/database.js";

const router = createRouter();

const defaultMigrationOptions = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const pendingMigrations = await runMigrations();
  response.status(200).json(pendingMigrations);
}

async function postHandler(request, response) {
  const migratedMigrations = await runMigrations({ dryRun: false });

  if (migratedMigrations.length > 0) {
    return response.status(201).json(migratedMigrations);
  }

  return response.status(200).json(migratedMigrations);
}

async function runMigrations({ dryRun } = defaultMigrationOptions) {
  let dbClient;

  try {
    dbClient = await database.getNewClient();

    return await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
      dryRun,
    });
  } finally {
    if (dbClient) {
      await dbClient.end();
    }
  }
}
