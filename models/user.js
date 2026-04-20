import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);

  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
      SELECT 
        *
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT
        1
          ;`,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
      });
    }

    return results.rows[0];
  }
}

async function create(userInputValues) {
  validateRequiredFields(userInputValues);
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  function validateRequiredFields(userInputValues) {
    if (!userInputValues) {
      throw new ValidationError({
        message: "Os dados do usuário são obrigatórios.",
        action: "Informe username, email e senha para realizar o cadastro.",
      });
    }

    if (!userInputValues.username?.trim()) {
      throw new ValidationError({
        message: "O username é obrigatório.",
        action: "Informe um username para realizar o cadastro.",
      });
    }

    if (!userInputValues.email?.trim()) {
      throw new ValidationError({
        message: "O email é obrigatório.",
        action: "Informe um email para realizar o cadastro.",
      });
    }

    if (!userInputValues.password?.trim()) {
      throw new ValidationError({
        message: "A senha é obrigatória.",
        action: "Informe uma senha para realizar o cadastro.",
      });
    }
  }

  async function validateUniqueUsername(username) {
    const results = await database.query({
      text: `
      SELECT 
        username
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
          ;`,
      values: [username],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "O username informado ja está sendo utilizado.",
        action: "Utilize outro username para realizar o cadastro.",
      });
    }
  }

  async function validateUniqueEmail(email) {
    const results = await database.query({
      text: `
      SELECT 
        email
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1)
          ;`,
      values: [email],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "O email informado ja está sendo utilizado.",
        action: "Utilize outro email para realizar o cadastro.",
      });
    }
  }

  async function runInsertQuery(userInputValues) {
    try {
      const results = await database.query({
        text: `
        INSERT INTO 
          users (username, email, password) 
          VALUES
            ($1, $2, $3)
          RETURNING
            *
            ;`,
        values: [
          userInputValues.username,
          userInputValues.email,
          userInputValues.password,
        ],
      });

      return results.rows[0];
    } catch (error) {
      const duplicatedField = getDuplicatedFieldFromUniqueViolation(error);

      if (duplicatedField === "username") {
        throw new ValidationError({
          message: "O username informado ja está sendo utilizado.",
          action: "Utilize outro username para realizar o cadastro.",
          cause: error,
        });
      }

      if (duplicatedField === "email") {
        throw new ValidationError({
          message: "O email informado ja está sendo utilizado.",
          action: "Utilize outro email para realizar o cadastro.",
          cause: error,
        });
      }

      throw error;
    }
  }

  function getDuplicatedFieldFromUniqueViolation(error) {
    if (error.cause?.code !== "23505") {
      return;
    }

    const constraint = error.cause.constraint;

    if (
      constraint === "users_username_key" ||
      constraint === "users_username_lower_unique_idx"
    ) {
      return "username";
    }

    if (
      constraint === "users_email_key" ||
      constraint === "users_email_lower_unique_idx"
    ) {
      return "email";
    }
  }
}

const user = {
  create,
  findOneByUsername,
};

export default user;
