import { Page, Locator } from '@playwright/test';

declare global {
  interface Window {
    SERVER_FLAGS?: { authDisabled?: boolean };
  }
}

export const DEFAULT_USERNAME = 'kubeadmin';

export class LoginPage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly idpMain: Locator;
  private readonly loggedInUser: Locator;
  private readonly logoutButton: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.locator('#inputUsername');
    this.passwordInput = page.locator('#inputPassword');
    this.submitButton = page.locator('button[type=submit]');
    this.idpMain = page.locator('.pf-v6-c-login__main');
    this.loggedInUser = page.getByTestId('username');
    this.logoutButton = page.getByTestId('log-out');
  }

  /** Reads the console runtime flag to short-circuit login on auth-disabled clusters. */
  private async isAuthDisabled(): Promise<boolean> {
    return Boolean(await this.page.evaluate(() => window.SERVER_FLAGS?.authDisabled));
  }

  async login(
    username: string = process.env.CLUSTER_USER || DEFAULT_USERNAME,
    password: string = process.env.CLUSTER_PASSWORD ?? '',
  ) {
    const idp =
      process.env.CLUSTER_IDP || (username === DEFAULT_USERNAME ? 'kube:admin' : undefined);

    await this.page.context().clearCookies();
    await this.page.goto('/', {
      timeout: 90_000,
      waitUntil: 'domcontentloaded',
    });

    if (await this.isAuthDisabled()) {
      return;
    }

    if (!password) {
      throw new Error(
        'CLUSTER_PASSWORD is required when auth is enabled. ' +
          'Set it via the CLUSTER_PASSWORD environment variable.',
      );
    }

    // The console can land either directly on the login form or on an identity
    // provider selection screen. Wait for whichever appears first.
    const state = await Promise.race([
      this.usernameInput
        .waitFor({ state: 'visible', timeout: 15000 })
        .then(() => 'login-form' as const),
      this.idpMain
        .waitFor({ state: 'visible', timeout: 15000 })
        .then(() => 'idp-selection' as const),
    ]);

    // Only pick an IDP if the username form isn't already present (the login
    // form also lives inside .pf-v6-c-login__main).
    if (state === 'idp-selection' && (await this.usernameInput.count()) === 0) {
      const idpButton = idp
        ? this.idpMain.locator('a.pf-v6-c-button', { hasText: idp })
        : this.idpMain.locator('a.pf-v6-c-button').first();
      await idpButton.click();
      await this.usernameInput.waitFor({ state: 'visible', timeout: 10000 });
    }

    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.loggedInUser.waitFor({ state: 'visible', timeout: 30000 });
  }

  async logout() {
    if (await this.isAuthDisabled()) {
      return;
    }
    await this.loggedInUser.click();
    await this.logoutButton.waitFor({ state: 'visible' });
    // Force-click: the user-menu dropdown may be briefly covered by an overlay.
    await this.logoutButton.click({ force: true });
  }
}
