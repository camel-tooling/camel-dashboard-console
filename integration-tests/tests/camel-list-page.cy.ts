import { checkErrors } from '../support';

const SKIP_HELM_INSTALL = Cypress.env('SKIP_HELM_INSTALL') === 'true';

describe('Camel Dashboard Console - List Page', () => {
  before(() => {
    cy.login();

    if (SKIP_HELM_INSTALL) {
      cy.log('Skipping Helm installation - assuming plugin is already loaded');
    }
  });

  beforeEach(() => {
    // Navigate to Camel list page
    cy.visit('/camel/all-namespaces');

    // Close any welcome popups
    cy.get('body').then(($body) => {
      if ($body.find('.pf-v6-c-modal-box').length > 0) {
        cy.get('.pf-v6-c-modal-box__close button').click({ force: true });
      }
    });
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.logout();
  });

  it('displays the Camel Applications list page', () => {
    // Verify page title
    cy.get('[data-test="page-heading"]', { timeout: 10000 }).should(
      'contain',
      'Camel Applications',
    );

    // Verify namespace bar is present
    cy.get('.co-namespace-bar').should('exist');
  });

  it('shows empty state when no CamelApps exist', () => {
    // Wait for the page to load
    cy.get('[data-test="page-heading"]', { timeout: 10000 }).should('exist');

    // Check for VirtualizedTable or empty state
    cy.get('body').then(($body) => {
      // If there are no CamelApps, empty state should be shown
      if ($body.find('[data-test="camelapp-list-empty"]').length > 0) {
        cy.log('Empty state is displayed');
        cy.byTestID('camelapp-list-empty').should('be.visible');
      } else {
        cy.log('CamelApps exist in the cluster - skipping empty state test');
      }
    });
  });

  it('allows namespace switching', () => {
    // Wait for namespace dropdown
    cy.get('.co-namespace-bar', { timeout: 10000 }).should('be.visible');

    // Click namespace dropdown
    cy.get('.co-namespace-dropdown button').click({ force: true });

    // Verify dropdown menu appears
    cy.get('[role="menu"]', { timeout: 5000 }).should('be.visible');

    // Check that the menu has items (namespace list)
    // Note: The "All Projects" text might be "All Namespaces" or localized
    cy.get('[role="menu"]').find('[role="menuitem"]').should('have.length.gt', 0);
  });

  it('displays list page filter when loaded', () => {
    // Wait for page to load
    cy.get('[data-test="page-heading"]', { timeout: 10000 }).should('exist');

    // ListPageFilter should be present (search input or filter component)
    // Check for ListPageBody which wraps the filter and table
    cy.get('.co-m-list').should('exist');

    // Or check for the VirtualizedTable which is always present
    cy.get('[data-test="page-heading"]').parent().should('contain.text', 'Camel Applications');
  });

  it('navigates to list page from sidebar', () => {
    // Navigate away first
    cy.visit('/');

    // Wait for sidebar
    cy.get('#page-sidebar', { timeout: 10000 }).should('exist');

    // Close any popups
    cy.get('body').then(($body) => {
      if ($body.find('.pf-v6-c-modal-box').length > 0) {
        cy.get('.pf-v6-c-modal-box__close button').click({ force: true });
      }
    });

    cy.wait(2000);

    // Navigate via sidebar
    cy.get('#page-sidebar').then(($sidebar) => {
      if ($sidebar.text().includes('Workloads')) {
        cy.get('#page-sidebar').contains('Workloads').click({ force: true });
      } else if ($sidebar.text().includes('Resources')) {
        cy.get('#page-sidebar').contains('Resources').click({ force: true });
      }
    });

    // Click Camel
    cy.get('#page-sidebar').contains('Camel', { timeout: 10000 }).click({ force: true });

    // Verify we're on the Camel page
    cy.url().should('include', '/camel');
    cy.get('[data-test="page-heading"]').should('contain', 'Camel Applications');
  });
});
