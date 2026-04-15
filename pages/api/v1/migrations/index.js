import { createRouter } from "next-connect";

import controller from "infra/controller.js";
import migrator from "models/migrator.js";

const router = createRouter();

// GET consulta migrations pendentes; POST executa as pendentes.
router.get(getHandler);
router.post(postHandler);

// Exporta o handler final da rota com o tratamento padrão de erros da aplicação.
export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  // Delega ao model a responsabilidade de descobrir o que ainda falta rodar.
  const pendingMigrations = await migrator.listPendingMigrations();
  response.status(200).json(pendingMigrations);
}

async function postHandler(request, response) {
  // Delega ao model a execução real das migrations pendentes.
  const migratedMigrations = await migrator.runPendingMigrations();

  if (migratedMigrations.length > 0) {
    // Se algo foi aplicado no banco, responde como recurso/processamento criado.
    return response.status(201).json(migratedMigrations);
  }

  // Se não havia pendências, a operação continua válida, mas sem novas alterações.
  return response.status(200).json(migratedMigrations);
}
