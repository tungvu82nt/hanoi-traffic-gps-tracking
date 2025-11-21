# MCP servers (local helpers)

This folder contains a local configuration for MCP (Model Context Protocol) helper servers used during development.

What I added

- `servers.json` — a redacted JSON list of MCP server entries you provided. Secrets/keys have been replaced with `<REDACTED_KEY>` placeholders.

How to run an MCP server manually

1. Install dependencies (if needed) and run the server indicated by the entry. Example (Sequential Thinking):

```bash
npx -y @modelcontextprotocol/server-sequential-thinking
```

2. Example: Playwright MCP server

```bash
npx -y @executeautomation/playwright-mcp-server
```

3. Example: GitHub MCP via `@smithery/cli` (requires a key)

```bash
export SMITHERY_KEY="<YOUR_KEY>"
npx -y @smithery/cli@latest run @smithery-ai/github --key "$SMITHERY_KEY" --profile blank-shrimp-yK4D4B
```

Security notes

- Do NOT commit secrets or API keys. `servers.json` is redacted — replace `<REDACTED_KEY>` with environment variables or local secret files that are excluded from Git.
- Recommended pattern: keep a separate file (not committed) like `.mcp/secrets.json` or use environment variables:

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxx"
export SMITHERY_KEY="xxxx"
```

Local orchestration

- This repo does not include a process manager for MCP entries. To start multiple MCP servers you can run commands in separate terminals, or create your own script that reads `servers.json` and spawns child processes.
- If you want, I can scaffold a simple `scripts/run-mcp.js` that loads `servers.json` and starts selected entries locally (with prompts to supply redacted secrets from env).

Files to ignore

- Add sensitive local files to `.gitignore` (example: `.mcp/secrets.json`). The repository now includes `.gitignore` rules to ignore `.mcp/*.secret.json` and `.mcp/secrets.json`.

Questions / next steps

- Do you want me to scaffold a small runner script (`scripts/run-mcp.js`) to spawn selected entries from `servers.json` and prompt for missing secrets?
- Do you prefer the config at a different path/name (e.g. `.mcprc`)?
