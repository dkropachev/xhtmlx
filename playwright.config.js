const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/browser",
  timeout: 30000,
  retries: 1,
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
