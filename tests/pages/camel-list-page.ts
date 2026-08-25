import { Page, Locator, expect } from '@playwright/test';
import { ConsolePage } from './console-page';

export class CamelListPage {
  readonly console: ConsolePage;
  readonly heading: Locator;
  readonly namespaceBar: Locator;
  readonly namespaceDropdown: Locator;
  readonly namespaceOptions: Locator;
  readonly rows: Locator;
  readonly emptyState: Locator;
  readonly list: Locator;

  constructor(private page: Page) {
    this.console = new ConsolePage(page);
    this.heading = page.getByTestId('page-heading');
    this.namespaceBar = page.locator('.co-namespace-bar');
    this.namespaceDropdown = page.getByRole('button', { name: 'Project: All Projects' });
    this.namespaceOptions = page
      .getByTestId('namespace-dropdown-menu')
      .getByTestId('dropdown-menu-item-link');
    this.rows = page.locator('tbody tr');
    this.emptyState = page.getByTestId('camelapp-list-empty');
    this.list = page.locator('.co-m-list');
  }

  async goto(namespace?: string) {
    const path = namespace ? `/camel/ns/${namespace}` : '/camel/all-namespaces';
    await this.page.goto(path);
    await this.console.closeWelcomePopup();
    await expect(this.heading).toBeVisible({ timeout: 30000 });
  }

  async waitForData() {
    await expect(this.rows.or(this.emptyState).first()).toBeVisible({
      timeout: 15000,
    });
  }

  async openNamespaceDropdown() {
    await expect(this.namespaceDropdown).toBeEnabled();
    await expect(async () => {
      if (!(await this.namespaceOptions.first().isVisible())) {
        await this.namespaceDropdown.click();
      }
      await expect(this.namespaceOptions.first()).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 30000 });
  }

  async selectNamespace(index: number): Promise<string> {
    const option = this.namespaceOptions.nth(index);
    const name = (await option.textContent())?.trim() ?? '';
    await option.click();
    return name;
  }

  async findFirstApp(): Promise<{ name: string; namespace: string } | null> {
    const link = this.page.locator('a[href*="/camel/app/ns/"]').first();
    try {
      await link.waitFor({ state: 'attached', timeout: 15000 });
    } catch {
      return null;
    }

    const href = await link.getAttribute('href');
    const match = href?.match(/\/camel\/app\/ns\/([^/]+)\/name\/([^/]+)/);
    if (!match) return null;

    return { namespace: match[1], name: match[2] };
  }

  async clickFirstApp() {
    await this.rows.first().getByTestId('camelapp-link').click();
  }
}
