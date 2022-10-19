// type definitions for custom commands like "createDefaultTodos"
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Get an element by its test id
     * @example
     * cy.getElementByTestId('query')
     */
    getElementByTestId<S = any>(
      testId: string,
      options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
    ): Chainable<S>;

    /**
     * Create an index
     * @example
     * cy.createIndex('indexID')
     * cy.createIndex('indexID', 'policy')
     */
    createIndex<S = any>(
      index: string,
      policyID?: string,
      settings?: any
    ): Chainable<S>;

    /**
     * Delete an index
     * @example
     * cy.deleteIndex('indexID')
     */
    deleteIndex<S = any>(index: string): Chainable<S>;

    /**
     * Bulk upload NDJSON fixture data
     * @example
     * cy.bulkUploadDocs('plugins/test/test_data.txt')
     */
    bulkUploadDocs<S = any>(
      fixturePath: string,
      index: string
      // options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
    ): Chainable<S>;

    /**
     * Adds an index pattern
     * @example
     * cy.createIndexPattern('patterId', 'patt*', 'timestamp')
     */
    createIndexPattern<S = any>(
      id: string,
      attributes: {
        title: string;
        timeFieldName?: string;
        [key: string]: any;
      }
    ): Chainable<S>;

    createIndexPatternWithTenantHeader<S = any>(
      id: string,
      attributes: {
        title: string;
        timeFieldName?: string;
        [key: string]: any;
      },
      header: string,
    ): Chainable<S>;

    /**
     * Delete an index pattern
     * @example
     * cy.createIndexPattern('patterId')
     */
    deleteIndexPattern<S = any>(id: string): Chainable<S>;

    /**
     * Performs drag and drop action
     * @example
     * cy.get('sourceSelector').drag('targetSelector')
     */
    drag<S = any>(targetSelector: string): Chainable<S>;
  }
}
