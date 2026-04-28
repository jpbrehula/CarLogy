import database from "infra/database.js";
import password from "models/password.js";
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
  await hashPasswordInObject(userInputValues);

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
          message: "O username informado já está sendo utilizado.",
          action: "Utilize outro username para realizar o cadastro.",
          cause: error,
        });
      }

      if (duplicatedField === "email") {
        throw new ValidationError({
          message: "O email informado já está sendo utilizado.",
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

async function update(username, userInputValues) {
  const currentUser = await findOneByUsername(username);

  validateAtLeastOneUpdatableField(userInputValues);

  if ("username" in userInputValues) {
    validateUsername(userInputValues.username);
    await validateUniqueUsername(userInputValues.username, currentUser.id);
  }

  if ("email" in userInputValues) {
    validateEmail(userInputValues.email);
    await validateUniqueEmail(userInputValues.email, currentUser.id);
  }

  if ("password" in userInputValues) {
    validatePassword(userInputValues.password);
    await hashPasswordInObject(userInputValues);
  }

  const userWithNewValues = { ...currentUser, ...userInputValues };

  const updatedUser = await runUpdateQuery(userWithNewValues);
  return updatedUser;

  async function runUpdateQuery(userWithNewValues) {
    const results = await database.query({
      text: `
        UPDATE
          users
        SET
          username = $2,
          email = $3,
          password = $4,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
        ;`,
      values: [
        userWithNewValues.id,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
      ],
    });

    return results.rows[0];
  }
}

function validateAtLeastOneUpdatableField(userInputValues) {
  const updatableFields = ["username", "email", "password"];
  const hasAtLeastOneUpdatableField = updatableFields.some((field) => {
    return field in userInputValues;
  });

  if (!hasAtLeastOneUpdatableField) {
    throw new ValidationError({
      message: "Nenhum campo foi informado para atualização.",
      action: "Informe ao menos um dos campos: username, email ou password.",
    });
  }
}

function validateUsername(username) {
  if (!username?.trim()) {
    throw new ValidationError({
      message: "O username é obrigatório.",
      action: "Informe um username para realizar esta operação.",
    });
  }
}

function validateEmail(email) {
  if (!email?.trim()) {
    throw new ValidationError({
      message: "O email é obrigatório.",
      action: "Informe um email para realizar esta operação.",
    });
  }
}

function validatePassword(password) {
  if (!password?.trim()) {
    throw new ValidationError({
      message: "A senha é obrigatória.",
      action: "Informe uma senha para realizar esta operação.",
    });
  }
}

async function validateUniqueUsername(username, currentUserId) {
  const results = await database.query({
    text: `
        SELECT
          username
        FROM
          users
        WHERE
          LOWER(username) = LOWER($1)
          AND ($2::uuid IS NULL OR id <> $2::uuid)
        ;`,
    values: [username, currentUserId || null],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O username informado já está sendo utilizado.",
      action: "Utilize outro username para realizar esta operação.",
    });
  }
}

async function validateUniqueEmail(email, currentUserId) {
  const results = await database.query({
    text: `
        SELECT
          email
        FROM
          users
        WHERE
          LOWER(email) = LOWER($1)
          AND ($2::uuid IS NULL OR id <> $2::uuid)
        ;`,
    values: [email, currentUserId || null],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O email informado já está sendo utilizado.",
      action: "Utilize outro email para realizar esta operação.",
    });
  }
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;
}

const user = {
  create,
  findOneByUsername,
  update,
};

export default user;
