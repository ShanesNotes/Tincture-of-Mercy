import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Match the repo-native art-gate harness so the strict WebGPU lane is
        // actually WebGPU on headless Linux; `?renderer=webgl2` still forces
        // the portable fallback for backend parity coverage.
        launchOptions: {
          args: [
            '--enable-unsafe-webgpu',
            '--enable-features=Vulkan',
            // Headless Chromium otherwise selects SwiftShader while still
            // reporting a WebGPU backend. The box gate must exercise RADV.
            '--use-angle=vulkan',
            // Measure renderer/sim throughput rather than the headless
            // compositor's ~54 Hz pacing ceiling.
            '--disable-frame-rate-limit',
          ],
        },
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
