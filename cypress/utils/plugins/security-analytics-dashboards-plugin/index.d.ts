/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// eslint-disable-next-line
///<reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
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
     * Should clear a field value (use with text and textarea fields)
     * @example
     * cy.getFieldByLabel('Rule name').clearValue()
     */
    clearValue(): Chainable<any>;

    /**
     * Validates that field contains value
     * Should be used with combobox or other fields that don't print its value in inputs
     * @example
     * cy.getFieldByLabel('Rule name').containsValue('Name')
     */
    containsValue(value: string): Chainable<any>;

    /**
     * Validates that field has error text
     * @example
     * cy.getFieldByLabel('Rule name').containsError('This fields is invalid')
     */
    containsError(errorText: string): Chainable<any>;

    /**
     * Validates that field has helper text
     * @example
     * cy.getFieldByLabel('Rule name').containsHelperText('Use this field for...')
     */
    containsHelperText(helperText: string): Chainable<any>;

    /**
     * Should not have error text
     * @example
     * cy.getFieldByLabel('Rule name').shouldNotHaveError()
     */
    shouldNotHaveError(): Chainable<any>;

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
     * Removes custom indices, detectors and rules
     * @example
     * cy.cleanUpTests()
     */
    cleanUpTests(): Chainable<any>;

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
     * Waits for page to be loaded
     * @param {string} pathname
     * @param {any} opts
     * @example
     * cy.waitForPageLoad('detectors')
     * cy.waitForPageLoad('detectors', {
     *   timeout: 20000,
     *   contains: 'text to verify'
     * })
     */
    waitForPageLoad(pathname: string, opts?: any): Chainable<any>;

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
     * Creates index with policy
     * @example
     * cy.createIndex("some_index", "some_policy")
     */
    createIndex(index: string, settings?: object): Chainable<any>;

    /**
     * Creates an index template.
     * @example
     * cy.createIndexTemplate("some_index_template", { "index_patterns": "abc", "properties": { ... } })
     */
    createIndexTemplate(name: string, template: object): Chainable<any>;

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
      partial: boolean
    ): Chainable<any>;

    /**
     * Creates a custom rule
     * @example
     * cy.createRule({})
     */
    createRule(ruleJSON: object): Chainable<any>;

    /**
     * Updates settings for index
     * @example
     * cy.updateIndexSettings("some_index", settings)
     */
    updateDetector(detectorId: string, detectorJSON: object): Chainable<any>;

    /**
     * Deletes detector by its name
     * @example
     * cy.deleteDetector("Cypress detector name")
     */
    deleteDetector(name: string): Chainable<any>;
  }
}
