import { defineConfig, devices } from '@playwright/test';
import { execFileSync } from 'child_process';
import os from 'os';
import path from 'path';
import { AUTH_FILE } from './paths';

const DEV_MODE = process.env.DEV === 'true';

function resolveBaseUrl(): string {
  if (DEV_MODE) return 'http://localhost:9000';

  if (process.env.CONSOLE_URL) return process.env.CONSOLE_URL;

  const clusterUrl = process.env.CLUSTER_URL;
  const user = process.env.CLUSTER_USER;
  const password = process.env.CLUSTER_PASSWORD;

  if (!clusterUrl || !user || !password) {
    throw new Error(
      'Missing required environment variables: CLUSTER_URL, CLUSTER_USER, CLUSTER_PASSWORD. ' +
        'Alternatively, set CONSOLE_URL directly or use DEV=true for local dev mode.',
    );
  }

  // Playwright imports this config in the main process and in every worker, so
  // resolveBaseUrl() runs concurrently. Give each process its own kubeconfig so
  // parallel `oc login` calls don't race on (or clobber) the shared ~/.kube/config.
  const env = {
    ...process.env,
    KUBECONFIG: path.join(os.tmpdir(), `pw-kubeconfig-${process.pid}`),
  };

  try {
    execFileSync(
      'oc',
      ['login', clusterUrl, '-u', user, '-p', password, '--insecure-skip-tls-verify'],
      { stdio: 'pipe', env },
    );
  } catch (e: any) {
    throw new Error(`oc login to ${clusterUrl} failed: ${e.stderr || e.message}`);
  }

  const url = execFileSync(
    'oc',
    ['get', 'consoles.config.openshift.io', 'cluster', '-o', 'jsonpath={.status.consoleURL}'],
    { encoding: 'utf-8', stdio: 'pipe', env },
  ).trim();

  if (!url) {
    throw new Error('Failed to detect console URL from the cluster');
  }

  return url;
}

export default defineConfig({
  testDir: '..',
  timeout: 60000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  outputDir: '../reports/artifacts',
  reporter: [
    ['html', { outputFolder: '../reports/html', open: 'never' }],
    ['json', { outputFile: '../reports/test-results.json' }],
  ],
  use: {
    baseURL: resolveBaseUrl(),
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 },
  },
  projects: [
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      use: { storageState: undefined },
    },
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: AUTH_FILE,
      },
      dependencies: ['auth-setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: AUTH_FILE,
      },
      dependencies: ['auth-setup'],
    },
  ],
  ...(DEV_MODE
    ? {
        webServer: [
          {
            command: 'yarn start',
            cwd: path.resolve(__dirname, '../..'),
            url: 'http://localhost:9001',
            reuseExistingServer: true,
            timeout: 120000,
          },
          {
            command: './start-console.sh',
            cwd: path.resolve(__dirname, '../..'),
            url: 'http://localhost:9000',
            reuseExistingServer: true,
            timeout: 120000,
          },
        ],
      }
    : {}),
});
