module.exports = {
  apps: [
    {
      name: "freshy-lk",
      script: "node",
      args: ".next/standalone/server.js",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
    },
  ],
};
