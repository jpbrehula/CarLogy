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
      });

      const response = await patchUser("user1", {
        username: "USER1",
      });

      const responseBody = await expectSuccessfulUpdate(response, createdUser, {
        username: "USER1",
      });

      const userInDatabase = await expectUserInDatabase("user1", {
        id: createdUser.id,
        username: "USER1",
      });
      expect(responseBody.username).toBe(userInDatabase.username);
    });

    test("With unique 'username'", async () => {
      const createdUser = await createUser({
        username: "uniqueuser1",
      });

      const response = await patchUser("uniqueuser1", {
        username: "uniqueuser2",
      });

      await expectSuccessfulUpdate(response, createdUser, {
        username: "uniqueuser2",
      });

      await expectUserInDatabase("uniqueuser2", {
        id: createdUser.id,
        username: "uniqueuser2",
      });
    });

    test("With no updatable fields", async () => {
      await createUser({
        username: "noupdatablefields1",
      });

      const response = await patchUser("noupdatablefields1", {});

      await expectValidationError(response, {
        message: "Nenhum campo foi informado para atualização.",
        action: "Informe ao menos um dos campos: username, email ou password.",
      });
    });

    test("With empty 'username'", async () => {
      await createUser({
        username: "emptyusername1",
      });

      const response = await patchUser("emptyusername1", {
        username: "",
      });

      await expectValidationError(response, {
        message: "O username é obrigatório.",
        action: "Informe um username para realizar esta operação.",
      });
    });

    test("With blank 'username'", async () => {
      await createUser({
        username: "blankusername1",
      });

      const response = await patchUser("blankusername1", {
        username: "   ",
      });

      await expectValidationError(response, {
        message: "O username é obrigatório.",
        action: "Informe um username para realizar esta operação.",
      });
    });

    test("With invalid 'username'", async () => {
      const createdUser = await createUser();

      const response = await patchUser(createdUser.username, {
        username: "invalid-username",
      });

      await expectValidationError(response, {
        message: "O username deve conter apenas caracteres alfanuméricos.",
        action:
          "Informe um username sem caracteres especiais para realizar esta operação.",
      });
    });

    test("With duplicated 'username'", async () => {
      await createUser({
        username: "duplicateduser1",
      });
      await createUser({
        username: "duplicateduser2",
      });

      const response = await patchUser("duplicateduser2", {
        username: "duplicateduser1",
      });

      await expectValidationError(response, {
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar esta operação.",
      });
    });

    test("With duplicated 'email'", async () => {
      await createUser({
        email: "email1@gmail.com",
      });
      const createdUser = await createUser({
        email: "email2@gmail.com",
      });

      const response = await patchUser(createdUser.username, {
        email: "email1@gmail.com",
      });

      await expectValidationError(response, {
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar esta operação.",
      });
    });

    test("With empty 'email'", async () => {
      const createdUser = await createUser();

      const response = await patchUser(createdUser.username, {
        email: "",
      });

      await expectValidationError(response, {
        message: "O email é obrigatório.",
        action: "Informe um email para realizar esta operação.",
      });
    });

    test("With blank 'email'", async () => {
      const createdUser = await createUser();

      const response = await patchUser(createdUser.username, {
        email: "   ",
      });

      await expectValidationError(response, {
        message: "O email é obrigatório.",
        action: "Informe um email para realizar esta operação.",
      });
    });

    test("With unique 'email'", async () => {
      const createdUser = await createUser({
        username: "uniqueemail1",
      });

      const response = await patchUser("uniqueemail1", {
        email: "unique-email2@gmail.com",
      });

      await expectSuccessfulUpdate(response, createdUser, {
        username: "uniqueemail1",
        email: "unique-email2@gmail.com",
      });
    });

    test("With same 'email' but different case", async () => {
      const createdUser = await createUser({
        username: "sameemail1",
        email: "same-email1@gmail.com",
      });

      const response = await patchUser("sameemail1", {
        email: "Same-Email1@gmail.com",
      });

      await expectSuccessfulUpdate(response, createdUser, {
        username: "sameemail1",
        email: "Same-Email1@gmail.com",
      });
    });

    test("With unique 'username' and unique 'email'", async () => {
      const createdUser = await createUser({
        username: "uniquevalues1",
      });

      const response = await patchUser("uniquevalues1", {
        username: "uniquevalues2",
        email: "unique-values2@gmail.com",
      });

      await expectSuccessfulUpdate(response, createdUser, {
        username: "uniquevalues2",
        email: "unique-values2@gmail.com",
      });

      await expectUserInDatabase("uniquevalues2", {
        id: createdUser.id,
        username: "uniquevalues2",
        email: "unique-values2@gmail.com",
      });
    });

    test("With empty 'password'", async () => {
      const createdUser = await createUser();

      const response = await patchUser(createdUser.username, {
        password: "",
      });

      await expectValidationError(response, {
        message: "A senha é obrigatória.",
        action: "Informe uma senha para realizar esta operação.",
      });
    });

    test("With blank 'password'", async () => {
      const createdUser = await createUser();

      const response = await patchUser(createdUser.username, {
        password: "   ",
      });

      await expectValidationError(response, {
        message: "A senha é obrigatória.",
        action: "Informe uma senha para realizar esta operação.",
      });
    });

    test("With new 'password'", async () => {
      const createdUser = await createUser({
        username: "newpassword1",
        password: "old-password",
      });

      const response = await patchUser("newpassword1", {
        password: "new-password",
      });

      await expectSuccessfulUpdate(response, createdUser, {
        username: "newpassword1",
      });

      const userInDatabase = await user.findOneByUsername("newpassword1");
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

const createUser = orchestrator.createUser;

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
  const expectedUser = {
    ...createdUser,
    ...expectedValues,
  };

  expect(responseBody).toEqual({
    id: expectedUser.id,
    username: expectedUser.username,
    email: expectedUser.email,
    password: responseBody.password,
    created_at: expectedUser.created_at.toISOString(),
    updated_at: responseBody.updated_at,
  });

  expect(uuidVersion(responseBody.id)).toBe(4);
  expect(Date.parse(responseBody.created_at)).not.toBeNaN();
  expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
  expect(responseBody.updated_at > responseBody.created_at).toBe(true);
  expect(responseBody.updated_at).not.toBe(createdUser.updated_at.toISOString());

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
