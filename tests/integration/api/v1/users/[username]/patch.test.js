import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import password from "models/password.js";

const BASE_URL = "http://localhost:3000/api/v1/users";
const JSON_HEADERS = {
  "Content-Type": "application/json",
};

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent 'username'", async () => {
      const response = await patchUser("UsuarioInexistente");

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
        status_code: 404,
      });
    });

    test("With same 'username' but different case", async () => {
      const createdUser = await createUser({
        username: "user1",
        email: "user1-case@gmail.com",
      });

      const response = await patchUser("user1", {
        username: "USER1",
      });

      const responseBody = await expectSuccessfulUpdate(response, createdUser, {
        username: "USER1",
        email: "user1-case@gmail.com",
      });

      const userInDatabase = await expectUserInDatabase("user1", {
        id: createdUser.id,
        username: "USER1",
      });
      expect(responseBody.username).toBe(userInDatabase.username);
    });

    test("With unique 'username'", async () => {
      const createdUser = await createUser({
        username: "unique-user1",
        email: "unique-user1@gmail.com",
      });

      const response = await patchUser("unique-user1", {
        username: "unique-user2",
      });

      await expectSuccessfulUpdate(response, createdUser, {
        username: "unique-user2",
        email: "unique-user1@gmail.com",
      });

      await expectUserInDatabase("unique-user2", {
        id: createdUser.id,
        username: "unique-user2",
      });
    });

    test("With no updatable fields", async () => {
      await createUser({
        username: "no-updatable-fields1",
        email: "no-updatable-fields1@gmail.com",
      });

      const response = await patchUser("no-updatable-fields1", {});

      await expectValidationError(response, {
        message: "Nenhum campo foi informado para atualização.",
        action: "Informe ao menos um dos campos: username, email ou password.",
      });
    });

    test("With empty 'username'", async () => {
      await createUser({
        username: "empty-username1",
        email: "empty-username1@gmail.com",
      });

      const response = await patchUser("empty-username1", {
        username: "",
      });

      await expectValidationError(response, {
        message: "O username é obrigatório.",
        action: "Informe um username para realizar esta operação.",
      });
    });

    test("With blank 'username'", async () => {
      await createUser({
        username: "blank-username1",
        email: "blank-username1@gmail.com",
      });

      const response = await patchUser("blank-username1", {
        username: "   ",
      });

      await expectValidationError(response, {
        message: "O username é obrigatório.",
        action: "Informe um username para realizar esta operação.",
      });
    });

    test("With duplicated 'username'", async () => {
      await createUser({
        username: "duplicated-user1",
        email: "duplicated-user1@gmail.com",
      });
      await createUser({
        username: "duplicated-user2",
        email: "duplicated-user2@gmail.com",
      });

      const response = await patchUser("duplicated-user2", {
        username: "duplicated-user1",
      });

      await expectValidationError(response, {
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar esta operação.",
      });
    });

    test("With duplicated 'email'", async () => {
      await createUser({
        username: "email1",
        email: "email1@gmail.com",
      });
      await createUser({
        username: "email2",
        email: "email2@gmail.com",
      });

      const response = await patchUser("email2", {
        email: "email1@gmail.com",
      });

      await expectValidationError(response, {
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar esta operação.",
      });
    });

    test("With empty 'email'", async () => {
      await createUser({
        username: "empty-email1",
        email: "empty-email1@gmail.com",
      });

      const response = await patchUser("empty-email1", {
        email: "",
      });

      await expectValidationError(response, {
        message: "O email é obrigatório.",
        action: "Informe um email para realizar esta operação.",
      });
    });

    test("With blank 'email'", async () => {
      await createUser({
        username: "blank-email1",
        email: "blank-email1@gmail.com",
      });

      const response = await patchUser("blank-email1", {
        email: "   ",
      });

      await expectValidationError(response, {
        message: "O email é obrigatório.",
        action: "Informe um email para realizar esta operação.",
      });
    });

    test("With unique 'email'", async () => {
      const createdUser = await createUser({
        username: "unique-email1",
        email: "unique-email1@gmail.com",
      });

      const response = await patchUser("unique-email1", {
        email: "unique-email2@gmail.com",
      });

      await expectSuccessfulUpdate(response, createdUser, {
        username: "unique-email1",
        email: "unique-email2@gmail.com",
      });
    });

    test("With same 'email' but different case", async () => {
      const createdUser = await createUser({
        username: "same-email1",
        email: "same-email1@gmail.com",
      });

      const response = await patchUser("same-email1", {
        email: "Same-Email1@gmail.com",
      });

      await expectSuccessfulUpdate(response, createdUser, {
        username: "same-email1",
        email: "Same-Email1@gmail.com",
      });
    });

    test("With unique 'username' and unique 'email'", async () => {
      const createdUser = await createUser({
        username: "unique-values1",
        email: "unique-values1@gmail.com",
      });

      const response = await patchUser("unique-values1", {
        username: "unique-values2",
        email: "unique-values2@gmail.com",
      });

      await expectSuccessfulUpdate(response, createdUser, {
        username: "unique-values2",
        email: "unique-values2@gmail.com",
      });

      await expectUserInDatabase("unique-values2", {
        id: createdUser.id,
        username: "unique-values2",
        email: "unique-values2@gmail.com",
      });
    });

    test("With empty 'password'", async () => {
      await createUser({
        username: "empty-password1",
        email: "empty-password1@gmail.com",
      });

      const response = await patchUser("empty-password1", {
        password: "",
      });

      await expectValidationError(response, {
        message: "A senha é obrigatória.",
        action: "Informe uma senha para realizar esta operação.",
      });
    });

    test("With blank 'password'", async () => {
      await createUser({
        username: "blank-password1",
        email: "blank-password1@gmail.com",
      });

      const response = await patchUser("blank-password1", {
        password: "   ",
      });

      await expectValidationError(response, {
        message: "A senha é obrigatória.",
        action: "Informe uma senha para realizar esta operação.",
      });
    });

    test("With new 'password'", async () => {
      const createdUser = await createUser({
        username: "new-password1",
        email: "new-password1@gmail.com",
        password: "old-password",
      });

      const response = await patchUser("new-password1", {
        password: "new-password",
      });

      await expectSuccessfulUpdate(response, createdUser, {
        username: "new-password1",
        email: "new-password1@gmail.com",
      });

      const userInDatabase = await user.findOneByUsername("new-password1");
      const correctPasswordMatch = await password.compare(
        "new-password",
        userInDatabase.password,
      );
      const incorrectPasswordMatch = await password.compare(
        "old-password",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
  });
});

async function createUser({ username, email, password = "senha123" }) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });

  expect(response.status).toBe(201);
  return response.json();
}

async function patchUser(username, body) {
  return fetch(`${BASE_URL}/${username}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function expectSuccessfulUpdate(response, createdUser, expectedValues) {
  expect(response.status).toBe(200);

  const responseBody = await response.json();

  expect(responseBody).toEqual({
    id: createdUser.id,
    username: expectedValues.username,
    email: expectedValues.email,
    password: responseBody.password,
    created_at: createdUser.created_at,
    updated_at: responseBody.updated_at,
  });

  expect(uuidVersion(responseBody.id)).toBe(4);
  expect(Date.parse(responseBody.created_at)).not.toBeNaN();
  expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
  expect(responseBody.updated_at > responseBody.created_at).toBe(true);
  expect(responseBody.updated_at).not.toBe(createdUser.updated_at);

  return responseBody;
}

async function expectValidationError(response, { message, action }) {
  expect(response.status).toBe(400);

  const responseBody = await response.json();

  expect(responseBody).toEqual({
    name: "ValidationError",
    message,
    action,
    status_code: 400,
  });
}

async function expectUserInDatabase(username, expectedValues) {
  const userInDatabase = await user.findOneByUsername(username);

  expect(userInDatabase.id).toBe(expectedValues.id);
  expect(userInDatabase.username).toBe(expectedValues.username);

  if ("email" in expectedValues) {
    expect(userInDatabase.email).toBe(expectedValues.email);
  }

  return userInDatabase;
}
