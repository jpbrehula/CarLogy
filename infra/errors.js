// Classe de erro customizado para representar falhas internas do servidor (HTTP 500)
// A ideia é padronizar erros inesperados sem expor detalhes sensíveis para o usuário
export class InternalServerError extends Error {
  constructor({ cause }) {
    // Chama o construtor da classe nativa Error:
    // - define uma mensagem genérica (segura para o usuário)
    // - armazena o erro original em "cause" para debug interno
    super("Um erro interno não esperado aconteceu.", {
      cause,
    });
    //Subscreve a propiedade name
    this.name = "InternalServerError";
    this.action = "Entre em contato com o suporte.";
    this.statusCode = 500;
  }

  // Controla a serialização do erro na API:
  // - Error padrão vira {} porque suas propriedades não são enumeráveis
  // - toJSON define explicitamente o formato da resposta
  // - retorno apenas a mensagem para não expor detalhes internos (stack, cause)
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

// Classe de erro customizado para representar falhas internas do servidor (HTTP 500)
// A ideia é padronizar erros inesperados sem expor detalhes sensíveis para o usuário
export class MethodNotAllowedError extends Error {
  constructor() {
    // Chama o construtor da classe nativa Error:
    // - define uma mensagem genérica (segura para o usuário)
    // - armazena o erro original em "cause" para debug interno
    super("Método não permitido para este endpoint.");
    //Subscreve a propiedade name
    this.name = "MethodNotAllowedError";
    this.action =
      "Verifique se o método HTTP enviado é válido para este endpoint.";
    this.statusCode = 405;
  }

  // Controla a serialização do erro na API:
  // - Error padrão vira {} porque suas propriedades não são enumeráveis
  // - toJSON define explicitamente o formato da resposta
  // - retorno apenas a mensagem para não expor detalhes internos (stack, cause)
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}
