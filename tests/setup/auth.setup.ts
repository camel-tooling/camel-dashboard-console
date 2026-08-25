import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/login';
import { AUTH_FILE } from '../config/paths';

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login();
  await page.context().storageState({ path: AUTH_FILE });
});
