import { test, expect } from './fixtures';

test.describe('Camel Dashboard Console - Details Page', () => {
  test('displays details page with correct title', async ({ app, detailsPage }) => {
    await detailsPage.goto(app.namespace, app.name);
    await expect(detailsPage.appName).toContainText(app.name);
  });

  test('displays Details, Resources, and Metrics tabs', async ({ app, detailsPage }) => {
    await detailsPage.goto(app.namespace, app.name);
    await expect(detailsPage.tab('Details')).toBeVisible();
    await expect(detailsPage.tab('Resources')).toBeVisible();
    await expect(detailsPage.tab('Metrics')).toBeVisible();
  });

  test('can switch between tabs', async ({ app, page, detailsPage }) => {
    await detailsPage.goto(app.namespace, app.name);
    await detailsPage.console.closeWelcomePopup();

    await detailsPage.switchTab('Resources');
    await expect(page).toHaveURL(/\/resources/);
    await expect(detailsPage.resourcesTab).toBeVisible();

    await detailsPage.switchTab('Metrics');
    await expect(page).toHaveURL(/\/metrics/);
    await expect(detailsPage.metricsTab).toBeVisible();

    await detailsPage.switchTab('Details');
    await expect(page).not.toHaveURL(/\/resources/);
    await expect(page).not.toHaveURL(/\/metrics/);
    await expect(detailsPage.detailsTab).toBeVisible();
  });

  test('Details tab shows CamelApp information', async ({ app, detailsPage }) => {
    await detailsPage.goto(app.namespace, app.name);
    await expect(detailsPage.detailsTab).toBeVisible();
    await expect(detailsPage.detailsTab).not.toBeEmpty();
    await expect(detailsPage.appName).toContainText(app.name);
  });

  test('Resources tab loads content', async ({ app, detailsPage }) => {
    await detailsPage.goto(app.namespace, app.name, '/resources');
    await expect(detailsPage.resourcesTab).toBeVisible();
    await expect(detailsPage.resourcesTab).not.toBeEmpty();
  });

  test('Metrics tab loads', async ({ app, detailsPage }) => {
    await detailsPage.goto(app.namespace, app.name, '/metrics');
    await expect(detailsPage.metricsTab).toBeVisible();
  });

  test('navigates from list page to details page', async ({ app, page, listPage, detailsPage }) => {
    await listPage.goto();
    await listPage.waitForData();
    await listPage.clickFirstApp();

    await expect(page).toHaveURL(new RegExp(`/camel/app/ns/${app.namespace}/name/${app.name}`));
    await expect(detailsPage.container).toBeVisible({ timeout: 30000 });
  });

  test('namespace bar is disabled on details page', async ({ app, detailsPage }) => {
    await detailsPage.goto(app.namespace, app.name);
    await expect(detailsPage.namespaceBar).toBeVisible();
    await expect(detailsPage.namespaceDropdown).toBeDisabled();
  });
});
