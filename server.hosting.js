/**
 * Entry point dla CyberFolks / CloudLinux Passenger.
 * Naprawia sciezki Windows z builda standalone (outputFileTracingRoot).
 */
const path = require("path");
const fs = require("fs");

const dir = __dirname;

process.env.NODE_ENV = "production";
process.chdir(dir);

const requiredPath = path.join(dir, ".next", "required-server-files.json");
if (!fs.existsSync(requiredPath)) {
  console.error("Brak pliku .next/required-server-files.json — wgraj pelny build.");
  process.exit(1);
}

const required = JSON.parse(fs.readFileSync(requiredPath, "utf8"));
const nextConfig = required.config;

// Sciezki z Windows builda -> katalog aplikacji na serwerze Linux
nextConfig.outputFileTracingRoot = dir;
if (nextConfig.turbopack) {
  nextConfig.turbopack.root = dir;
}

process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

try {
  require("next");
} catch (err) {
  if (err && err.code === "MODULE_NOT_FOUND") {
    console.error("");
    console.error("Brak modulu next — zaleznosci nie sa zainstalowane.");
    console.error("W panelu Node.js: Run NPM Install, potem Restart.");
    console.error("node_modules musi byc symlinkiem z panelu (nie wgranym folderem).");
    console.error("");
  }
  throw err;
}

const { startServer } = require("next/dist/server/lib/start-server");

const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

let keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10);
if (
  Number.isNaN(keepAliveTimeout) ||
  !Number.isFinite(keepAliveTimeout) ||
  keepAliveTimeout < 0
) {
  keepAliveTimeout = undefined;
}

startServer({
  dir,
  isDev: false,
  config: nextConfig,
  hostname,
  port,
  allowRetry: false,
  keepAliveTimeout,
}).catch((err) => {
  console.error("Nie udalo sie uruchomic Next.js:", err);
  process.exit(1);
});
