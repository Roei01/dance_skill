import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const [, , scriptPath, ...extraArgs] = process.argv;

if (!scriptPath) {
  console.error("Usage: node scripts/run-k6.mjs <k6-script-path> [...k6 args]");
  process.exit(1);
}

const baseUrl =
  process.env.BASE_URL ||
  process.env.APP_BASE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  "https://rbdt-online.onrender.com";

const resolvedScriptPath = path.resolve(process.cwd(), scriptPath);

const result = spawnSync("k6", ["run", resolvedScriptPath, ...extraArgs], {
  stdio: "inherit",
  env: {
    ...process.env,
    BASE_URL: String(baseUrl).replace(/\/$/, ""),
  },
});

if (result.error) {
  if (result.error.code === "ENOENT") {
    console.error(
      "k6 is not installed. Install it first, then rerun the load test.",
    );
  } else {
    console.error(result.error.message);
  }

  process.exit(1);
}

process.exit(result.status ?? 1);
