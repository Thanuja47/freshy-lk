import { defineConfig, devices } from "@playwright/test";

const bypassToken = process.env.PLAYWRIGHT_PROTECTION_BYPASS;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 300000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://freshy-51tnqmi4d-nirmalthanuja7-gmailcoms-projects.vercel.app",
    extraHTTPHeaders: bypassToken
      ? {
          "x-vercel-protection-bypass": bypassToken,
        }
      : {},
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
