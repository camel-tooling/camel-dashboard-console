import { test, expect } from './fixtures';

test.describe('Camel Dashboard Console - List Page', () => {
  test.beforeEach(async ({ listPage }) => {
    await listPage.goto();
  });

  test('displays the Camel Applications list page', async ({ listPage }) => {
    await expect(listPage.heading).toContainText('Camel Applications');
    await expect(listPage.namespaceBar).toBeVisible();
  });

  test('shows apps or empty state', async ({ listPage }) => {
    await listPage.waitForData();
  });

  test('allows namespace switching', async ({ page, listPage }) => {
    await listPage.openNamespaceDropdown();
    const name = await listPage.selectNamespace(1);
    await expect(page).toHaveURL(new RegExp(`/camel/ns/${name}`));
  });

  test('displays list page content', async ({ listPage }) => {
    await expect(listPage.list).toBeVisible();
  });

  test('navigates to list page from sidebar', async ({ page, consolePage, listPage }) => {
    await page.goto('/');
    await consolePage.closeWelcomePopup();
    await consolePage.navigateToCamel();

    await expect(page).toHaveURL(/\/camel/);
    await expect(listPage.heading).toContainText('Camel Applications');
  });
});
