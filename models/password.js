import bcryptjs from "bcryptjs";
import { createHmac } from "node:crypto";

async function hash(password) {
  const passwordWithPepper = applyPepper(password);
  const rounds = getNumberOfRounds();
  return await bcryptjs.hash(passwordWithPepper, rounds);
}

function getNumberOfRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 1;
}

async function compare(providedPassword, storedPassword) {
  const providedPasswordWithPepper = applyPepper(providedPassword);
  return await bcryptjs.compare(providedPasswordWithPepper, storedPassword);
}

function applyPepper(password) {
  const pepper = process.env.PASSWORD_PEPPER;

  if (!pepper && process.env.NODE_ENV === "production") {
    throw new Error("PASSWORD_PEPPER não configurado.");
  }

  if (!pepper) {
    return password;
  }

  return createHmac("sha256", pepper).update(password).digest("base64");
}

const password = {
  hash,
  compare,
};

export default password;
