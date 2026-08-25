import { test as base } from '@playwright/test';
import { ConsolePage } from '../pages/console-page';
import { CamelListPage } from '../pages/camel-list-page';
import { CamelDetailsPage } from '../pages/camel-details-page';
import { checkErrors } from '../support/check-errors';
import { AUTH_FILE } from '../config/paths';

export type AppInfo = { name: string; namespace: string };

type TestFixtures = {
  consolePage: ConsolePage;
  listPage: CamelListPage;
  detailsPage: CamelDetailsPage;
  app: AppInfo;
  checkConsoleErrors: void;
};

type WorkerFixtures = {
  appInfo: AppInfo | null;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  consolePage: async ({ page }, use) => {
    await use(new ConsolePage(page));
  },
  listPage: async ({ page }, use) => {
    await use(new CamelListPage(page));
  },
  detailsPage: async ({ page }, use) => {
    await use(new CamelDetailsPage(page));
  },
  app: async ({ appInfo }, use) => {
    test.skip(!appInfo, 'No CamelApp found in cluster');
    await use(appInfo as AppInfo);
  },
  // Auto fixture: after every test, assert the console logged no JS errors.
  checkConsoleErrors: [
    async ({ page }, use) => {
      await use();
      await checkErrors(page);
    },
    { auto: true },
  ],
  appInfo: [
    async ({ browser }, use) => {
      const context = await browser.newContext({
        storageState: AUTH_FILE,
        ignoreHTTPSErrors: true,
      });
      const page = await context.newPage();
      const listPage = new CamelListPage(page);

      await listPage.goto();
      await listPage.waitForData();
      const app = await listPage.findFirstApp();

      await context.close();
      await use(app);
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
