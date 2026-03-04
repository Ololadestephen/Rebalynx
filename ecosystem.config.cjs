module.exports = {
  apps: [
    {
      name: "rebalynx-backend",
      cwd: "./backend",
      script: "dist/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "rebalynx-worker",
      cwd: "./backend",
      script: "dist/workers/rebalance.worker.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
