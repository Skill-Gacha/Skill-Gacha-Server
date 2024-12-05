module.exports = {
  apps: [
    {
      name: "gacha-server",
      script: "./src/server.js",
      instances: 1,
      exec_mode: "cluster"
    }
  ]
};