module.exports = {
  apps: [
    {
      name: "sms-backend",
      script: "index.ts",
      cwd: "./backend",
      interpreter: "bun",
      interpreter_args: "run",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_file: "./logs/backend-combined.log",
      time: true,
    },
  ],
};
