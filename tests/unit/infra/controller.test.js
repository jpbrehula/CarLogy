import controller from "infra/controller.js";
import { ServiceError } from "infra/errors.js";

describe("infra/controller", () => {
  test("returns 503 when receiving a ServiceError", () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const error = new ServiceError({
      message: "Erro na conexao com Banco ou na Query.",
      cause: new Error("database is down"),
    });

    controller.errorHandlers.onError(error, {}, response);

    expect(response.status).toHaveBeenCalledWith(503);

    const publicErrorObject = response.json.mock.calls[0][0];

    expect(publicErrorObject.name).toBe("InternalServerError");
    expect(publicErrorObject.statusCode).toBe(503);
    expect(publicErrorObject.toJSON()).toEqual({
      name: "InternalServerError",
      message: "Um erro interno não esperado aconteceu.",
      action: "Entre em contato com o suporte.",
      status_code: 503,
    });

    consoleErrorSpy.mockRestore();
  });
});
