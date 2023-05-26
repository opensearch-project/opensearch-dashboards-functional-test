// type definitions for custom commands like "createDefaultTodos"
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Returns all text nodes from the chart
     * @example
     * cy.get('chart').getTextNodes()
     */
    getTextNodes(): Chainable<any>;

    /**
     * Returns text node containing the text from the chart and
     * validates if the node is found
     * @example
     * cy.get('chart').containsText("Label")
     */
    containsText(text: string, exactMatch?: boolean): Chainable<any>;

    /**
     * Returns visualization panel by title
     * @example
     * cy.getVisPanelByTitle('[Logs] Visitors by OS')
     */
    getVisPanelByTitle(title: string): Chainable<any>;

    /**
     * Returns visualization chart svg
     * @example
     * cy.getVisPanelByTitle('[Logs] Visitors by OS').getChart()
     */
    getChart(): Chainable<any>;

    /**
     * Returns all arc nodes from the chart
     * @example
     * cy.get('chart').getArcNodes()
     */
    getArcNodes(): Chainable<any>;

    /**
     * Returns all circle nodes from the chart
     * @example
     * cy.get('chart').getCircleNodes()
     */
    getCircleNodes(): Chainable<any>;

    /**
     * Returns all arc nodes from the chart
     * @example
     * cy.get('chart').getArcNode().filterNodesBy('value', 'some value')
     */
    filterNodesBy(filter: string, value: string): Chainable<any>;

    /**
     * Returns node data
     * @example
     * cy.get('chart').getArcNode().filterNodesBy('name', 'rule').getNodeData()
     */
    getNodeData(): Chainable<any>;

    /**
     * Returns all label nodes from the chart
     * @example
     * cy.get('chart').getLabelNodes()
     */
    getLabelNodes(): Chainable<any>;

    /**
     * Returns all label nodes from the chart
     * @example
     * cy.get('visPanel').getLegendNodes()
     */
    getLegendNodes(): Chainable<any>;

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
  }
}
