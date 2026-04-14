const mockConnect = jest.fn();
const mockQuery = jest.fn();
const mockEnd = jest.fn();

jest.mock("pg", () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    query: mockQuery,
    end: mockEnd,
  })),
}));

import database from "infra/database.js";

describe("infra/database", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("throws ServiceError when pg query fails", async () => {
    mockConnect.mockResolvedValue();
    mockQuery.mockRejectedValue(new Error("query failed"));
    mockEnd.mockResolvedValue();

    await expect(database.query("SELECT 1")).rejects.toMatchObject({
      name: "ServiceError",
      message: "Erro na conexão com Banco ou na Query.",
      action: "Verifique se o serviço está disponível.",
      statusCode: 503,
    });

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith("SELECT 1");
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });
});
