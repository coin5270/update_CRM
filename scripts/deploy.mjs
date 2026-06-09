import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const localConfigHome = resolve(repoRoot, ".wrangler");
const localAppData = resolve(localConfigHome, "appdata");
const wranglerBin = resolve(repoRoot, "node_modules", ".bin", "wrangler.cmd");

const result = spawnSync(wranglerBin, ["deploy"], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    APPDATA: localAppData,
    LOCALAPPDATA: localAppData,
    HOME: localConfigHome,
    USERPROFILE: localConfigHome,
    XDG_CONFIG_HOME: localConfigHome,
    WRANGLER_HOME: localConfigHome,
  },
});

process.exit(result.status ?? 1);
