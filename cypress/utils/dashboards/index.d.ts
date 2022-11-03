// type definitions for custom commands like "createDefaultTodos"
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Wait for Dashboards page to load
     * @example
     * cy.waitForLoader()
     */
    waitForLoader(): Chainable<any>;

    /**
     * Set the top nav query value
     * @example
     * cy.setTopNavQuery('products.base_price > 40')
     */
    setTopNavQuery(value: string): Chainable<any>;

    /**
     * Set the top nav date range.
     * Date format: MMM D, YYYY @ HH:mm:ss.SSS
     * @example
     * cy.setTopNavDate('Oct 5, 2022 @ 00:57:06.429', 'Oct 6, 2022 @ 00:57:06.429')
     */
    setTopNavDate(start: string, end: string): Chainable<any>;

    /**
     * Clicks the update button on the top nav.
     * @example
     * cy.updateTopNav()
     */
    updateTopNav(): Chainable<any>;
  }
}
