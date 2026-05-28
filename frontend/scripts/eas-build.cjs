const { spawnSync } = require("node:child_process");

const profile = process.argv[2];
const extraArgs = process.argv.slice(3);

if (!profile) {
  console.error("Usage: node scripts/eas-build.cjs <profile> [extra eas args]");
  process.exit(1);
}

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(
  npxCommand,
  ["eas-cli", "build", "--platform", "android", "--profile", profile, ...extraArgs],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      EAS_SKIP_AUTO_FINGERPRINT: "1",
    },
  }
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
