// type definitions for custom commands like "createDefaultTodos"
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Returns visualization panel by title
     * @example
     * cy.getVisPanelByTitle('[Logs] Visitors by OS')
     */
    getVisPanelByTitle(title: string): Chainable<any>;

    /**
     * Opens vis panel context menu
     * @example
     * cy.get('visPanel').openVisContextMenu()
     */
    openVisContextMenu(): Chainable<any>;

    /**
     * Clicks vis panel context menu item
     * @example
     * cy.clickVisPanelMenuItem('Alerting')
     */
    clickVisPanelMenuItem(text: string): Chainable<any>;

    /**
     * Gets all items in the context menu
     * @example
     * cy.getVisPanelByTitle('my-visualization')
          .openVisContextMenu()
          .getMenuItems()
          .contains('View Events')
          .should('exist');
     */
    getMenuItems(): Chainable<any>;

    /**
     * Visits a dashboard
     * @example
     * cy.visitDashboard('My-Dashboard')
     */
    visitDashboard(dashboardName: string): Chainable<any>;
  }
}
