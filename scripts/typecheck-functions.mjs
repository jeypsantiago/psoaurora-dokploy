#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceDenoPath =
  process.platform === "win32"
    ? path.resolve(__dirname, "..", "tools", "deno", "deno.exe")
    : path.resolve(__dirname, "..", "tools", "deno", "deno");

const denoCommand = existsSync(workspaceDenoPath) ? workspaceDenoPath : "deno";

const entrypoints = [
  "supabase/functions/media-assets/index.ts",
  "supabase/functions/media-public/index.ts",
  "supabase/functions/staff-user-admin/index.ts",
];

const denoCheck = spawnSync(denoCommand, ["--version"], {
  stdio: "ignore",
  shell: false,
});

if (denoCheck.status !== 0) {
  console.error("Deno is required for `npm run typecheck:functions`.");
  console.error(
    "Install Deno, or place a local binary at `tools/deno`, then rerun this command to validate Supabase edge functions.",
  );
  process.exit(1);
}

const result = spawnSync(
  denoCommand,
  ["check", "--config", "supabase/functions/deno.json", ...entrypoints],
  {
    stdio: "inherit",
    shell: false,
  },
);

process.exit(result.status ?? 1);
