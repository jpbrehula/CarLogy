// Importa o módulo de banco de dados que você criou em infra/database.js
// Esse módulo expõe funções como database.query(...)
import database from "infra/database.js";

import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  // Apaga completamente o schema public (tabelas, migrations table, etc)
  // e recria ele vazio
  // O "cascade" garante que tudo que depende do schema também é removido
  await database.query("drop schema public cascade; create schema public;");
});

// Teste principal do arquivo
// Verifica o comportamento do endpoint POST /api/v1/migrations
test("POST to /api/v1/migrations should return 200", async () => {
  // PRIMEIRA chamada ao endpoint de migrations
  // Espera-se que ele EXECUTE as migrations
  const response1 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });

  // Verifica se o status HTTP retornado é 201 (Created)
  // 201 indica que algo novo foi criado (as migrations rodaram)
  expect(response1.status).toBe(201);

  // Converte o corpo da resposta para JSON
  const response1Body = await response1.json();

  // Garante que o corpo da resposta é um array
  // (lista de migrations executadas)
  expect(Array.isArray(response1Body)).toBe(true);

  // Garante que pelo menos uma migration foi executada
  expect(response1Body.length).toBeGreaterThan(0);

  // SEGUNDA chamada ao mesmo endpoint
  // Agora as migrations JÁ FORAM executadas
  const response2 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });

  // Agora o status esperado é 200 (OK)
  // Porque não há novas migrations para executar
  expect(response2.status).toBe(200);

  // Converte o corpo da segunda resposta para JSON
  const response2Body = await response2.json();

  // Continua sendo um array
  expect(Array.isArray(response2Body)).toBe(true);

  // Agora o array deve estar vazio,
  // pois não existem migrations pendentes
  expect(response2Body.length).toBe(0);
});
