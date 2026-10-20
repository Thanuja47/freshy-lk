import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 300000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://freshy-rhrlieupv-nirmalthanuja7-gmailcoms-projects.vercel.app",
    extraHTTPHeaders: {
      "x-vercel-protection-bypass": "PaHMvUyqaVRYb4mh1Rdnl9H9fz67uc5K",
    },
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
