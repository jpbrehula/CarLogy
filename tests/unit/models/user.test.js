jest.mock("infra/database.js", () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

import database from "infra/database.js";
import user from "models/user.js";

const mockDatabaseQuery = database.query;

describe("models/user", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("throws ValidationError when user input values are missing", async () => {
    await expect(user.create()).rejects.toMatchObject({
      name: "ValidationError",
      message: "Os dados do usuário são obrigatórios.",
      action: "Informe username, email e senha para realizar o cadastro.",
      statusCode: 400,
    });

    expect(mockDatabaseQuery).not.toHaveBeenCalled();
  });

  test("throws ValidationError when database rejects a duplicated email during insert", async () => {
    mockDatabaseQuery
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockRejectedValueOnce({
        cause: {
          code: "23505",
          constraint: "users_email_lower_unique_idx",
        },
      });

    await expect(
      user.create({
        username: "joaopedro",
        email: "joao@gmail.com",
        password: "senha123",
      }),
    ).rejects.toMatchObject({
      name: "ValidationError",
      message: "O email informado ja está sendo utilizado.",
      action: "Utilize outro email para realizar o cadastro.",
      statusCode: 400,
    });
  });

  test("throws ValidationError when database rejects a duplicated username during insert", async () => {
    mockDatabaseQuery
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockRejectedValueOnce({
        cause: {
          code: "23505",
          constraint: "users_username_lower_unique_idx",
        },
      });

    await expect(
      user.create({
        username: "joaopedro",
        email: "joao@gmail.com",
        password: "senha123",
      }),
    ).rejects.toMatchObject({
      name: "ValidationError",
      message: "O username informado ja está sendo utilizado.",
      action: "Utilize outro username para realizar o cadastro.",
      statusCode: 400,
    });
  });
});
