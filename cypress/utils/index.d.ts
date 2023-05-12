// type definitions for custom commands like "createDefaultTodos"
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {

    /**
     * Returns table first row
     * Can find elements deeper in a row with selector
     * @param {string} text
     * @example
     * cy.get('selector').ospSearch('Txt to write into input')
     */
    ospSearch(text: string): Chainable<any>;

    /**
     * Clears input text
     * @example
     * cy.get('selector').ospClear()
     */
    ospClear(): Chainable<any>;

    /**
     * Returns table first row
     * Can find elements deeper in a row with selector
     * @param {string} text
     * @example
     * cy.get('selector').ospType('Txt to write into input')
     */
    ospType(text: string): Chainable<any>;

    /**
     * Creates a custom rule
     * @example
     * cy.createRule({})
     */
    createRule(ruleJSON: object): Chainable<any>;

    /**
     * Creates a custom rule
     * @example
     * cy.updateRule('ruleId', {})
     */
    updateRule(ruleId: string, ruleJSON: object): Chainable<any>;

    /**
     * Creates a custom rule
     * @example
     * cy.deleteRule('Rule name')
     */
    deleteRule(ruleName: string): Chainable<any>;

    /**
     * Returns element by its text
     * @example
     * cy.getElementByText('.euiTitle', 'Some title')
     */
    getElementByText(locator: string, text: string): Chainable<any>;

    /**
     * Returns button by its text
     * @example
     * cy.getButtonByText('Button text')
     */
    getButtonByText(text: string): Chainable<any>;

    /**
     * Returns input by its placeholder
     * @example
     * cy.getInputByPlaceholder('Search rules...')
     */
    getInputByPlaceholder(placeholder: string): Chainable<any>;

    /**
     * Returns combobox input by its placeholder
     * @example
     * cy.getComboboxByPlaceholder('Select data input...')
     */
    getComboboxByPlaceholder(placeholder: string): Chainable<any>;

    /**
     * Returns field input by label
     * @example
     * cy.getFieldByLabel('Detector name')
     */
    getFieldByLabel(label: string, type?: string): Chainable<any>;

    /**
     * Returns textarea by label
     * @example
     * cy.getTextareaByLabel('Detector description')
     */
    getTextareaByLabel(label: string): Chainable<any>;

    /**
     * Returns element by data-test-subj attribute value
     * @example
     * cy.getElementByTestSubject('alerts-input-element')
     */
    getElementByTestSubject(subject: string): Chainable<any>;

    /**
     * Returns radio by id
     * @example
     * cy.getRadioButtonById('radioId')
     */
    getRadioButtonById(id: string): Chainable<any>;

    /**
     * Selects combobox item(s)
     * @example
     * cy.get('combo).selectComboboxItem('some item value')
     */
    selectComboboxItem(items: string | string[]): Chainable<any>;

    /**
     * Clears combobox value(s)
     * @example
     * cy.get('combo).clearCombobox()
     */
    clearCombobox(): Chainable<any>;

    /**
     * Triggers enter key event on the focused element
     * @example
     * cy.pressEnterKey()
     */
    pressEnterKey(): Chainable<any>;

    /**
     * Triggers backspace key event on the focused element
     * @example
     * cy.pressBackspaceKey()
     */
    pressBackspaceKey(numberOfPresses?: number): Chainable<any>;

    /**
     * Validates details panel item
     * @example
     * cy.validateDetailsItem('Data source', '.index-name')
     */
    validateDetailsItem(label: string, value: string): Chainable<any>;

    /**
     * Validates url path
     * @example
     * cy.urlShouldContain('/detector-details')
     */
    urlShouldContain(path: string): Chainable<any>;

    /**
     * Validates table items
     * @example
     * cy.validateTable('/detector-details')
     */
    validateTable(data: { [key: string]: string }[]): Chainable<any>;

    /**
     * Get an element by its test id
     * @example
     * cy.getElementByTestId('query')
     */
    getElementByTestId<S = any>(
      testId: string,
      options?: Partial<Loggable & Timeoutable & Withinable & Shadow>,
    ): Chainable<S>;

    /**
     * Creates a detector
     * @example
     * cy.createPolicy({ "detector_type": ... })
     */
    createDetector(detectorJSON: object): Chainable<any>;

    /**
     * Creates a fields mapping aliases for detector
     * @example
     * cy.createAliasMappings('indexName', 'windows', {...}, true)
     */
    createAliasMappings(
      indexName: string,
      ruleTopic: string,
      aliasMappingsBody: object,
      partial: boolean,
    ): Chainable<any>;

    /**
     * Updates settings for index
     * @example
     * cy.updateIndexSettings("some_index", settings)
     */
    updateDetector(detectorId: string, detectorJSON: object): Chainable<any>;

    /**
     * Create an index
     * @example
     * cy.createIndex('indexID')
     * cy.createIndex('indexID', 'policy')
     */
    createIndex<S = any>(
      index: string,
      policyID?: string,
      settings?: any,
    ): Chainable<S>;

    /**
     * Delete an index
     * @example
     * cy.deleteIndex('indexID')
     */
    deleteIndex<S = any>(index: string): Chainable<S>;

    /**
     /**
     * Deletes all indices in cluster
     * @example
     * cy.deleteAllIndices()
     */
    deleteAllIndices(): Chainable<any>;

    /**
     * Deletes all custom rules in cluster
     * @example
     * cy.deleteAllCustomRules()
     */
    deleteAllCustomRules(): Chainable<any>;

    /**
     * Deletes all detectors in cluster
     * @example
     * cy.deleteAllDetectors()
     */
    deleteAllDetectors(): Chainable<any>;

    /**
     * Removes custom indices, detectors and rules
     * @example
     * cy.cleanUpTests()
     */
    cleanUpTests(): Chainable<any>;

    /**
     * Bulk upload NDJSON fixture data
     * @example
     * cy.bulkUploadDocs('plugins/test/test_data.txt')
     */
    bulkUploadDocs<S = any>(
      fixturePath: string,
      index: string,
      // options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
    ): Chainable<S>;

    /**
     * Import saved objects
     * @example
     * cy.importSavedObject('plugins/test/exported_data.ndjson')
     */
    importSavedObjects<S = any>(
      fixturePath: string,
      overwrite?: boolean,
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
      search?: string,
    ): Chainable<S>;

    /**
     * Deletes detector by its name
     * @example
     * cy.deleteSAPDetector("Cypress detector name")
     */
    deleteSAPDetector(name: string): Chainable<any>;

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
     * Returns table first row
     * Finds elements deeper in a row with selector
     * @param {string} selector
     * @example
     * cy.getTableFirstRow()
     * cy.getTableFirstRow('td')
     */
    getTableFirstRow(selector: string): Chainable<any>;

    /**
     * Changes the Default tenant for the domain.
     * @example
     * cy.changeDefaultTenant({multitenancy_enabled: true, private_tenant_enabled: true, default_tenant: tenantName, });
     */
    changeDefaultTenant<S = any>(
      attributes: {
        multitenancy_enabled: boolean,
        private_tenant_enabled: boolean,
        default_tenant: string;
      },
      // header: string,
      // default_tenant: string
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
