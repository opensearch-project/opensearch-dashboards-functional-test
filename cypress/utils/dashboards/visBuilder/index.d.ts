// type definitions for custom commands like "createDefaultTodos"
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Select datasource based on value
     * @example
     * cy.vbSelectDataSource('vis_builder')
     */
    vbSelectDataSource(dataSource: string): Chainable<any>;

    /**
     * Select visualization type based on display value
     * @example
     * cy.vbSelectVisType('Bar')
     */
    vbSelectVisType(type: string): Chainable<any>;
  }
}
