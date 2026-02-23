import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status");
      // Status HTTP
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      // updated.at
      expect(responseBody.updated_at).toBeDefined();
      const parseUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parseUpdatedAt);

      // database existe
      expect(responseBody.dependencies.database).toBeDefined();

      //version
      expect(responseBody.dependencies.database.version).toBeDefined();
      expect(typeof responseBody.dependencies.database.version).toBe("string");
      expect(
        responseBody.dependencies.database.max_connections,
      ).toBeGreaterThan(0);

      //used connections
      expect(responseBody.dependencies.database.used_connections).toBeDefined();
      expect(typeof responseBody.dependencies.database.used_connections).toBe(
        "number",
      );
      expect(
        responseBody.dependencies.database.used_connections,
      ).toBeGreaterThanOrEqual(0);
      expect(
        responseBody.dependencies.database.used_connections,
      ).toBeLessThanOrEqual(responseBody.dependencies.database.max_connections);
    });
  });
});
