const { version } = require("./package.json");

module.exports = {
  apps: [
    {
      name: "kapster",
      script: "npm",
      args: "start",
      cwd: __dirname,
      version,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "agent-worker",
      script: "scripts/agent-worker.ts",
      interpreter: "npx",
      interpreterArgs: "tsx",
      cwd: __dirname,
      restart_delay: 5000,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
