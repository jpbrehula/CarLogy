// Importa o módulo de banco (infra/database.js)
// Ele tem a função database.query(...) que executa SQL no PostgreSQL
import database from "infra/database.js";

import orchestrator from "tests/orchestrator.js";

// beforeAll é um hook do Jest: roda UMA vez antes de todos os testes deste arquivo
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  // Apaga completamente o schema public (tabelas, migrations table, etc)
  // e recria ele vazio
  // O "cascade" garante que tudo que depende do schema também é removido
  await database.query("drop schema public cascade; create schema public;");
});

// Teste de integração do endpoint GET /api/v1/migrations
// A ideia: chamar o endpoint e verificar se ele responde corretamente
test("GET to /api/v1/migrations should return 200", async () => {
  // Faz uma requisição HTTP GET para o endpoint de migrations
  // GET aqui serve para "listar" as migrations pendentes (não executa)
  const response = await fetch("http://localhost:3000/api/v1/migrations");

  // Verifica o status HTTP retornado
  // 200 = OK (a requisição funcionou)
  expect(response.status).toBe(200);

  // Converte o corpo da resposta para JSON
  // O endpoint deve retornar uma lista (array) com as migrations pendentes
  const responseBody = await response.json();

  // Garante que o corpo retornado é um array
  expect(Array.isArray(responseBody)).toBe(true);

  // Garante que existe pelo menos 1 migration pendente
  // Como o banco foi limpo no beforeAll, deve ter migrations para aplicar
  expect(responseBody.length).toBeGreaterThan(0);
});
