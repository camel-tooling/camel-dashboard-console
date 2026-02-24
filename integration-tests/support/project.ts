export {};

declare global {
  namespace Cypress {
    interface Chainable {
      createProject(name: string): Chainable<Element>;
      deleteProject(name: string): Chainable<Element>;
    }
  }
}

// any command added below, must be added to global Cypress interface above

Cypress.Commands.add('createProject', (name: string) => {
  cy.log(`Create project`);
  cy.exec(`oc new-project ${name}`).then((result) => {
    result.stderr && cy.log('Error creating project: ', result.stderr);
    result.stdout && cy.log('Successfully created project: ', result.stdout);
  });
});

Cypress.Commands.add('deleteProject', (name: string) => {
  cy.log(`Delete project`);
  cy.exec(`oc delete project ${name}`).then((result) => {
    result.stderr && cy.log('Error deleting project: ', result.stderr);
    result.stdout && cy.log('Successfully deleted project: ', result.stdout);
  });
});
