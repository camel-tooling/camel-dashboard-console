import { test, expect } from './fixtures';

test.describe('Camel Dashboard Console plugin', () => {
  test('plugin is loaded and navigable via sidebar', async ({ page, consolePage }) => {
    await page.goto('/');
    await consolePage.closeWelcomePopup();
    await consolePage.navigateToCamel();
    await expect(page).toHaveURL(/\/camel/);
    await expect(page.locator('[data-test="page-heading"]')).toBeVisible({ timeout: 10000 });
  });
});
