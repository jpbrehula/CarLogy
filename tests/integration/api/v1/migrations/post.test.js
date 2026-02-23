import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    describe("Running pending migrations", () => {
      // Teste principal do arquivo
      test("For the first time", async () => {
        // PRIMEIRA chamada ao endpoint de migrations
        // Espera-se que ele EXECUTE as migrations
        const response1 = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
          },
        );
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
      });
      test("For the second time", async () => {
        // SEGUNDA chamada ao mesmo endpoint
        // Agora as migrations JÁ FORAM executadas
        const response2 = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
          },
        );

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
    });
  });
});
