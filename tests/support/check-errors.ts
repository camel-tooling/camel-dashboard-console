import { Page, expect } from '@playwright/test';

/**
 * Fails the test if the OpenShift console recorded a JS error during the run.
 * The console sets `window.windowError` to the error message when an uncaught
 * error occurs, and leaves it null/undefined otherwise.
 */
export async function checkErrors(page: Page) {
  const windowError = await page.evaluate(
    () => (window as Window & { windowError?: string | null }).windowError ?? undefined,
  );
  expect(windowError, `Console JS error detected: ${windowError}`).toBeUndefined();
}
