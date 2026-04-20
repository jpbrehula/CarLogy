const { spawn, execSync } = require("child_process");

let shuttingDown = false;

function cleanup() {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log("\n🛑 Parando serviços...");

  try {
    execSync("npm run services:stop", { stdio: "inherit" });
  } catch (error) {
    console.error("Erro ao parar serviços:", error);
  }

  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

try {
  execSync("npm run services:up", { stdio: "inherit" });
  execSync("npm run services:wait:database", { stdio: "inherit" });
  execSync("npm run migrations:up", { stdio: "inherit" });

  const nextDev = spawn("npx", ["next", "dev"], {
    stdio: "inherit",
    shell: true,
  });

  nextDev.on("close", cleanup);
} catch (error) {
  cleanup();
}
