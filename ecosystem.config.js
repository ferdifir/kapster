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
  ],
};
