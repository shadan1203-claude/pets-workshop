import dotenv from "dotenv";

dotenv.config();

function validateConfig() {
  const required = [
    "GITHUB_TOKEN",
    "GITHUB_OWNER",
    "GITHUB_REPO"
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`${key} is missing`);
    }
  }
}

validateConfig();

console.log("GitHub MCP started");