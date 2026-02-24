import { checkErrors } from '../support';

const PLUGIN_TEMPLATE_NAME = 'camel-dashboard-console';
const PLUGIN_TEMPLATE_PULL_SPEC = Cypress.env('PLUGIN_TEMPLATE_PULL_SPEC');
const SKIP_HELM_INSTALL = Cypress.env('SKIP_HELM_INSTALL') === 'true';
export const isLocalDevEnvironment = Cypress.config('baseUrl').includes('localhost');

const installHelmChart = (path: string) => {
  cy.exec(
    `cd ../../camel-dashboard-console && ${path} upgrade -i ${PLUGIN_TEMPLATE_NAME} charts/camel-dashboard-console -n ${PLUGIN_TEMPLATE_NAME} --create-namespace --set plugin.image=${PLUGIN_TEMPLATE_PULL_SPEC}`,
    {
      failOnNonZeroExit: false,
    },
  )
    .get('[data-test="refresh-web-console"]', { timeout: 300000 })
    .should('exist')
    .then((result) => {
      cy.reload();
      cy.visit(`/dashboards`);
      cy.log('Error installing helm chart: ', result.stderr);
      cy.log('Successfully installed helm chart: ', result.stdout);
    });
};
const deleteHelmChart = (path: string) => {
  cy.exec(
    `cd ../../camel-dashboard-console && ${path} uninstall ${PLUGIN_TEMPLATE_NAME} -n ${PLUGIN_TEMPLATE_NAME} && oc delete namespaces ${PLUGIN_TEMPLATE_NAME}`,
    {
      failOnNonZeroExit: false,
    },
  ).then((result) => {
    cy.log('Error uninstalling helm chart: ', result.stderr);
    cy.log('Successfully uninstalled helm chart: ', result.stdout);
  });
};

describe('Camel Dashboard Console plugin test', () => {
  before(() => {
    cy.login();

    if (SKIP_HELM_INSTALL) {
      console.log('SKIP_HELM_INSTALL is set, skipping helm installation');
      cy.log('Skipping Helm installation - assuming plugin is already loaded');
      return;
    }

    if (!isLocalDevEnvironment) {
      console.log('this is not a local env, installig helm');

      cy.exec('cd ../../camel-dashboard-console && ./install_helm.sh', {
        failOnNonZeroExit: false,
      }).then((result) => {
        cy.log('Error installing helm binary: ', result.stderr);
        cy.log('Successfully installed helm binary in "/tmp" directory: ', result.stdout);

        installHelmChart('/tmp/helm');
      });
    } else {
      console.log('this is a local env, installing helm chart');

      installHelmChart('helm');
    }
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    if (!SKIP_HELM_INSTALL) {
      if (!isLocalDevEnvironment) {
        deleteHelmChart('/tmp/helm');
      } else {
        deleteHelmChart('helm');
      }
    }
    cy.logout();
  });

  it('Verify the Camel Dashboard Console plugin is loaded', () => {
    // Wait for sidebar to be available
    cy.get('#page-sidebar', { timeout: 30000 }).should('exist');

    // Close any welcome/onboarding popups or guided tours
    // Check if there's a modal or popup and close it
    cy.get('body').then(($body) => {
      // Check for PatternFly modal
      if ($body.find('.pf-v6-c-modal-box').length > 0) {
        cy.log('Modal detected - attempting to close');
        // Try to find close button in the modal
        cy.get('.pf-v6-c-modal-box').within(() => {
          // Look for X close button
          cy.get('.pf-v6-c-modal-box__close button').click({ force: true });
        });
      }
      // Check for guided tour modal specifically
      else if ($body.find('[data-test="guided-tour-modal"]').length > 0) {
        cy.log('Closing guided tour modal');
        cy.get('[data-test="guided-tour-modal"]').find('button').first().click({ force: true });
      }
    });

    // Wait for console to initialize
    cy.wait(2000);

    // Try to find Camel in the sidebar - it could be under Workloads (admin) or Resources (dev)
    cy.get('#page-sidebar').then(($sidebar) => {
      if ($sidebar.text().includes('Workloads')) {
        // Admin perspective - click Workloads first
        cy.log('Admin perspective detected - navigating via Workloads');
        cy.get('#page-sidebar').contains('Workloads', { timeout: 10000 }).click({ force: true });
      } else if ($sidebar.text().includes('Resources')) {
        // Developer perspective - click Resources first
        cy.log('Developer perspective detected - navigating via Resources');
        cy.get('#page-sidebar').contains('Resources', { timeout: 10000 }).click({ force: true });
      } else {
        // Try to click Camel directly if visible
        cy.log('Looking for Camel directly in sidebar');
      }
    });

    // Wait for and click Camel navigation item
    cy.get('#page-sidebar').contains('Camel', { timeout: 10000 }).click({ force: true });

    // Verify we're on the Camel page
    cy.url().should('include', '/camel');

    // Verify the page loaded (should show Camel apps or empty state)
    cy.get('[data-test="page-heading"]', { timeout: 10000 }).should('exist');
  });
});
