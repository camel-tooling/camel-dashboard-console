/* eslint-disable @typescript-eslint/no-use-before-define */
import Loggable = Cypress.Loggable;
import Timeoutable = Cypress.Timeoutable;
import Withinable = Cypress.Withinable;
import Shadow = Cypress.Shadow;

export {};

declare global {
  namespace Cypress {
    interface Chainable {
      byTestID(
        selector: string,
        options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
      ): Chainable<Element>;
      byLegacyTestID(
        selector: string,
        options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
      ): Chainable<Element>;
      byTestActionID(selector: string): Chainable<Element>;
      byTestSelector(
        selector: string,
        options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
      ): Chainable<JQuery<HTMLElement>>;
    }
  }
}

// any command added below, must be added to global Cypress interface above

Cypress.Commands.add(
  'byTestID',
  (
    selector: string,
    options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
  ) => {
    cy.get(`[data-test="${selector}"]`, options);
  }
);

Cypress.Commands.add(
  'byLegacyTestID',
  (
    selector: string,
    options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
  ) => {
    cy.get(`[data-test-id="${selector}"]`, options);
  }
);

Cypress.Commands.add('byTestActionID', (selector: string) => {
  cy.get(`[data-test-action="${selector}"]:not(.pf-m-disabled)`);
});

Cypress.Commands.add(
  'byTestSelector',
  (
    selector: string,
    options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
  ) => {
    cy.get(`[data-test-selector="${selector}"]`, options);
  }
);
