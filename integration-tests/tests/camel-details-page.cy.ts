import { checkErrors, testName } from '../support';

const PLUGIN_NAME = 'camel-dashboard-console';
const SKIP_HELM_INSTALL = Cypress.env('SKIP_HELM_INSTALL') === 'true';

// This test requires at least one CamelApp to exist in the cluster
// You may need to create a test CamelApp resource before running this test

describe('Camel Dashboard Console - Details Page', () => {
  let testCamelApp: { name: string; namespace: string } | null = null;

  before(() => {
    cy.login();

    if (SKIP_HELM_INSTALL) {
      cy.log('Skipping Helm installation - assuming plugin is already loaded');
    }

    // Try to find an existing CamelApp to use for testing
    // Navigate to list page and check if any exist
    cy.visit('/camel/all-namespaces');

    // Close welcome popup if present
    cy.get('body').then(($body) => {
      if ($body.find('.pf-v6-c-modal-box').length > 0) {
        cy.get('.pf-v6-c-modal-box__close button').click({ force: true });
      }
    });

    // Wait for the page to load
    cy.get('[data-test="page-heading"]', { timeout: 10000 }).should('exist');

    // Wait for the VirtualizedTable to render (either with data or empty state)
    // This ensures the API call has completed
    cy.get('.co-m-list', { timeout: 15000 }).should('be.visible');

    // Give the table a moment to render rows after data loads
    cy.wait(3000);

    // Try to find a CamelApp in the list
    cy.get('body', { timeout: 10000 }).then(($body) => {
      // Debug: Log what we find (console.log shows in terminal)
      const testRowsCount = $body.find('[data-test-rows="resource-row"]').length;
      const linksCount = $body.find('a[href*="/camel/app/ns/"]').length;

      console.log(`DEBUG: Looking for CamelApps...`);
      console.log(`DEBUG: Found ${testRowsCount} elements with [data-test-rows="resource-row"]`);
      console.log(`DEBUG: Found ${linksCount} CamelApp links`);

      cy.log(`Looking for CamelApps...`);
      cy.log(`Found ${testRowsCount} elements with [data-test-rows="resource-row"]`);
      cy.log(`Found ${linksCount} CamelApp links`);

      // Try multiple selectors to find CamelApps
      // First try the data-test-rows selector
      if ($body.find('[data-test-rows="resource-row"]').length > 0) {
        cy.log('Found CamelApps via data-test-rows - will use first one for testing');
        cy.get('[data-test-rows="resource-row"]')
          .first()
          .should('be.visible')
          .within(() => {
            cy.get('[data-test="camelapp-link"]')
              .first()
              .then(($link) => {
                const href = $link.attr('href');
                const match = href.match(/\/camel\/app\/ns\/([^/]+)\/name\/([^/]+)/);
                if (match) {
                  testCamelApp = {
                    namespace: match[1],
                    name: match[2],
                  };
                  cy.log(`Using CamelApp: ${testCamelApp.name} in ${testCamelApp.namespace}`);
                }
              });
          });
      }
      // Fallback: Try to find links directly
      else if ($body.find('a[href*="/camel/app/ns/"]').length > 0) {
        cy.log('Found CamelApps via href links - will use first one for testing');
        const firstLink = $body.find('a[href*="/camel/app/ns/"]').first().attr('href');
        const match = firstLink.match(/\/camel\/app\/ns\/([^/]+)\/name\/([^/]+)/);
        if (match) {
          testCamelApp = {
            namespace: match[1],
            name: match[2],
          };
          cy.log(`Using CamelApp: ${testCamelApp.name} in ${testCamelApp.namespace}`);
        }
      } else {
        cy.log('WARNING: No CamelApps found in cluster - details page tests will be skipped');
      }
    });
  });

  beforeEach(function () {
    // Skip tests if no CamelApp is available
    if (!testCamelApp) {
      this.skip();
    }
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.logout();
  });

  it('displays the CamelApp details page with correct title', () => {
    // Navigate directly to details page
    cy.visit(`/camel/app/ns/${testCamelApp.namespace}/name/${testCamelApp.name}`);

    // Wait for page to load (.co-m-pane is the main container)
    cy.get('.co-m-pane', { timeout: 10000 }).should('be.visible');

    // Verify the page contains the CamelApp name (it's in the title component)
    cy.get('.co-m-pane').should('contain', testCamelApp.name);
  });

  it('displays all three tabs: Details, Resources, and Metrics', () => {
    cy.visit(`/camel/app/ns/${testCamelApp.namespace}/name/${testCamelApp.name}`);

    // Wait for page to load
    cy.get('.co-m-pane', { timeout: 10000 }).should('be.visible');

    // HorizontalNav renders as a nav element with tabs
    // Verify all three tab links exist
    cy.contains('Details').should('exist');
    cy.contains('Resources').should('exist');
    cy.contains('Metrics').should('exist');
  });

  it('can switch between tabs', () => {
    cy.visit(`/camel/app/ns/${testCamelApp.namespace}/name/${testCamelApp.name}`);

    // Wait for page to load
    cy.get('.co-m-pane', { timeout: 10000 }).should('be.visible');

    // Give it a moment for loading overlay to clear
    cy.wait(2000);

    // Click Resources tab (force in case overlay is present)
    cy.contains('Resources').click({ force: true });

    // Verify URL changed
    cy.url().should('include', '/resources');

    // Click Metrics tab
    cy.contains('Metrics').click({ force: true });

    // Verify URL changed
    cy.url().should('include', '/metrics');

    // Click Details tab to go back
    cy.contains('Details').click({ force: true });

    // Verify we're back to details (no /resources or /metrics in URL)
    cy.url().should('not.include', '/resources');
    cy.url().should('not.include', '/metrics');
  });

  it('Details tab shows CamelApp information', () => {
    cy.visit(`/camel/app/ns/${testCamelApp.namespace}/name/${testCamelApp.name}`);

    // Wait for page to load
    cy.get('.co-m-pane', { timeout: 10000 }).should('be.visible');

    // The details page should show some content
    // Just verify the page is not empty and has the CamelApp name
    cy.get('.co-m-pane').should('not.be.empty');
    cy.get('.co-m-pane').should('contain', testCamelApp.name);
  });

  it('Resources tab loads and displays content', () => {
    cy.visit(`/camel/app/ns/${testCamelApp.namespace}/name/${testCamelApp.name}/resources`);

    // Wait for page to load
    cy.get('.co-m-pane', { timeout: 10000 }).should('be.visible');

    // Resources tab should display some content
    cy.get('.co-m-pane').should('not.be.empty');
  });

  it('Metrics tab loads', () => {
    cy.visit(`/camel/app/ns/${testCamelApp.namespace}/name/${testCamelApp.name}/metrics`);

    // Wait for page to load
    cy.get('.co-m-pane', { timeout: 10000 }).should('be.visible');

    // Metrics tab should display something (charts, empty state, or error)
    cy.get('.co-m-pane').should('not.be.empty');
  });

  it('navigates from list page to details page', () => {
    // Start at list page
    cy.visit('/camel/all-namespaces');

    // Wait for list to load
    cy.get('[data-test="page-heading"]', { timeout: 10000 }).should('exist');
    cy.get('.co-m-list', { timeout: 15000 }).should('be.visible');
    cy.wait(3000); // Wait for data to load

    // Click on the first CamelApp
    cy.get('[data-test-rows="resource-row"]').first().find('[data-test="camelapp-link"]').click({ force: true });

    // Verify we're on a details page
    cy.url().should('match', /\/camel\/app\/ns\/[^/]+\/name\/[^/]+/);

    // Verify the page loaded
    cy.get('.co-m-pane', { timeout: 10000 }).should('be.visible');
  });

  it('namespace bar is disabled on details page', () => {
    cy.visit(`/camel/app/ns/${testCamelApp.namespace}/name/${testCamelApp.name}`);

    // Namespace bar should exist but be disabled
    cy.get('.co-namespace-bar', { timeout: 10000 }).should('exist');

    // The namespace dropdown should be disabled
    cy.get('.co-namespace-dropdown button').should('be.disabled');
  });
});
