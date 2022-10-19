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
     * Import saved objects
     * @example
     * cy.importSavedObject('plugins/test/exported_data.ndjson')
     */
    importSavedObjects<S = any>(
      fixturePath: string,
      overwrite?: boolean
    ): Chainable<S>;

    /**
     * Delete a saved object
     * @example
     * cy.deleteSavedObject('index-pattern', 'id')
     */
    deleteSavedObject<S = any>(type: string, id: string): Chainable<S>;

    /**
     * Delete all saved objects of a particular type
     * Optionally, narrow down the results using search
     * @example
     * cy.deleteSavedObjectByType('index-pattern')
     * cy.deleteSavedObjectByType('index-pattern', 'search string')
     */
    deleteSavedObjectByType<S = any>(
      type: string,
      search?: string
    ): Chainable<S>;

    /**
     * Adds an index pattern
     * @example
     * cy.createIndexPattern('patterId', { title: 'patt*', timeFieldName: 'timestamp' })
     */
    createIndexPattern<S = any>(
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
     * Set advanced setting values
     * tip: setting the value to null set's it to its default value
     * @example
     * cy.setAdvancedSetting({ 'visualize:enableLabs' : true })
     */
    setAdvancedSetting<S = any>(changes: { [key: string]: any }): Chainable<S>;

    /**
     * Performs drag and drop action
     * @example
     * cy.get('sourceSelector').drag('targetSelector')
     */
    drag<S = any>(targetSelector: string): Chainable<S>;
  }
}
