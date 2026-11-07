"use strict";

// PostToolUse validation for edited files. Exit code 2 reports the failure back to Claude.

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());

function targetPath() {
  try {
    const input = JSON.parse(fs.readFileSync(0, "utf8"));
    const file = input && input.tool_input && input.tool_input.file_path;
    return typeof file === "string" && file ? path.resolve(root, file) : null;
  } catch {
    return null;
  }
}

function fail(message) {
  process.stderr.write(`Post-edit validation failed: ${message}\n`);
  process.exit(2);
}

function run(command, args) {
  return spawnSync(command, args, { encoding: "utf8", timeout: 20000, windowsHide: true });
}

const file = targetPath();
if (!file || !fs.existsSync(file) || /[\\/](node_modules|dist|\.astro)[\\/]/.test(file)) process.exit(0);

const rel = path.relative(root, file);
const ext = path.extname(file).toLowerCase();

if (ext === ".js" || ext === ".mjs" || ext === ".cjs") {
  const result = run(process.execPath, ["--check", file]);
  if (result.status !== 0) fail(`${rel}\n${result.stderr}`);
} else if (ext === ".json") {
  try {
    JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(`${rel} is not valid JSON: ${error.message}`);
  }
} else if (ext === ".py") {
  const code = 'import ast,sys;ast.parse(open(sys.argv[1],encoding="utf-8").read())';
  for (const python of ["py", "python3", "python"]) {
    const result = run(python, ["-c", code, file]);
    if (result.error) continue;
    if (result.status !== 0) fail(`${rel}\n${result.stderr}`);
    break;
  }
}
process.exit(0);
