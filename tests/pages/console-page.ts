import { Page, expect } from '@playwright/test';

export class ConsolePage {
  constructor(private page: Page) {}

  async closeWelcomePopup() {
    try {
      const modal = this.page.locator('.pf-v6-c-modal-box');
      await modal.waitFor({ state: 'visible', timeout: 3000 });
      await modal.locator('.pf-v6-c-modal-box__close button').click();
      await modal.waitFor({ state: 'hidden' });
    } catch {
      // No popup present
    }
  }

  async navigateToCamel() {
    const sidebar = this.page.locator('#page-sidebar');
    const section = sidebar.getByRole('button', { name: /Workloads|Resources/ }).first();
    const camelLink = sidebar.getByRole('link', { name: 'Camel' });

    await expect(async () => {
      if ((await section.getAttribute('aria-expanded')) !== 'true') {
        await section.click();
      }
      await camelLink.click({ timeout: 5000 });
      await expect(this.page).toHaveURL(/\/camel/, { timeout: 5000 });
    }).toPass();
  }
}
