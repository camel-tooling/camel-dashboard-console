import { Page, Locator, expect } from '@playwright/test';
import { ConsolePage } from './console-page';

export class CamelDetailsPage {
  readonly console: ConsolePage;
  readonly container: Locator;
  readonly appName: Locator;
  readonly namespaceBar: Locator;
  readonly namespaceDropdown: Locator;
  readonly detailsTab: Locator;
  readonly resourcesTab: Locator;
  readonly metricsTab: Locator;

  constructor(private page: Page) {
    this.console = new ConsolePage(page);
    this.container = page.getByTestId('camelapp-details-page');
    this.appName = page.getByTestId('camelapp-name');
    this.namespaceBar = page.locator('.co-namespace-bar');
    this.namespaceDropdown = page.locator('.co-namespace-dropdown__menu-toggle');
    this.detailsTab = page.getByTestId('camelapp-details-tab');
    this.resourcesTab = page.getByTestId('camelapp-resources-tab');
    this.metricsTab = page.getByTestId('camelapp-metrics-tab');
  }

  tab(name: string) {
    return this.page.locator(`[data-test-id="horizontal-link-${name}"]`);
  }

  async goto(namespace: string, name: string, tabPath = '') {
    await this.page.goto(`/camel/app/ns/${namespace}/name/${name}${tabPath}`);
    await expect(this.container).toBeVisible({ timeout: 30000 });
  }

  async switchTab(name: string) {
    await this.tab(name).click();
  }
}
