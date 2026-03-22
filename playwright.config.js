const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/browser",
  timeout: 15000,
  retries: 0,
  workers: "75%",
  use: {
    headless: true,
    baseURL: "http://localhost:3333",
  },
  webServer: {
    command: "node tests/browser/server.js",
    port: 3333,
    reuseExistingServer: true,
  },
});
