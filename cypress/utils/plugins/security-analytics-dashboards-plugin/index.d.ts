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
     * cy.sa_getElementByText('.euiTitle', 'Some title')
     */
    sa_getElementByText(locator: string, text: string): Chainable<any>;

    /**
     * Returns button by its text
     * @example
     * cy.sa_getButtonByText('Button text')
     */
    sa_getButtonByText(text: string): Chainable<any>;

    /**
     * Returns input by its placeholder
     * @example
     * cy.sa_getInputByPlaceholder('Search rules...')
     */
    sa_getInputByPlaceholder(placeholder: string): Chainable<any>;

    /**
     * Returns combobox input by its placeholder
     * @example
     * cy.sa_getComboboxByPlaceholder('Select data input...')
     */
    sa_getComboboxByPlaceholder(placeholder: string): Chainable<any>;

    /**
     * Returns field input by label
     * @example
     * cy.sa_getFieldByLabel('Detector name')
     */
    sa_getFieldByLabel(label: string, type?: string): Chainable<any>;

    /**
     * Returns textarea by label
     * @example
     * cy.sa_getTextareaByLabel('Detector description')
     */
    sa_getTextareaByLabel(label: string): Chainable<any>;

    /**
     * Returns element by data-test-subj attribute value
     * @example
     * cy.sa_getElementByTestSubject('alerts-input-element')
     */
    sa_getElementByTestSubject(subject: string): Chainable<any>;

    /**
     * Returns radio by id
     * @example
     * cy.sa_getRadioButtonById('radioId')
     */
    sa_getRadioButtonById(id: string): Chainable<any>;

    /**
     * Selects combobox item(s)
     * @example
     * cy.get('combo).sa_selectComboboxItem('some item value')
     */
    sa_selectComboboxItem(items: string | string[]): Chainable<any>;

    /**
     * Clears combobox value(s)
     * @example
     * cy.get('combo).sa_clearCombobox()
     */
    sa_clearCombobox(): Chainable<any>;

    /**
     * Triggers enter key event on the focused element
     * @example
     * cy.sa_pressEnterKey()
     */
    sa_pressEnterKey(): Chainable<any>;

    /**
     * Triggers backspace key event on the focused element
     * @example
     * cy.sa_pressBackspaceKey()
     */
    sa_pressBackspaceKey(numberOfPresses?: number): Chainable<any>;

    /**
     * Validates details panel item
     * @example
     * cy.sa_validateDetailsItem('Data source', '.index-name')
     */
    sa_validateDetailsItem(label: string, value: string): Chainable<any>;

    /**
     * Should clear a field value (use with text and textarea fields)
     * @example
     * cy.sa_getFieldByLabel('Rule name').sa_clearValue()
     */
    sa_clearValue(): Chainable<any>;

    /**
     * Validates that field contains value
     * Should be used with combobox or other fields that don't print its value in inputs
     * @example
     * cy.sa_getFieldByLabel('Rule name').sa_containsValue('Name')
     */
    sa_containsValue(value: string): Chainable<any>;

    /**
     * Validates that field has error text
     * @example
     * cy.sa_getFieldByLabel('Rule name').sa_containsError('This fields is invalid')
     */
    sa_containsError(errorText: string): Chainable<any>;

    /**
     * Validates that field has helper text
     * @example
     * cy.sa_getFieldByLabel('Rule name').sa_containsHelperText('Use this field for...')
     */
    sa_containsHelperText(helperText: string): Chainable<any>;

    /**
     * Should not have error text
     * @example
     * cy.sa_getFieldByLabel('Rule name').sa_shouldNotHaveError()
     */
    sa_shouldNotHaveError(): Chainable<any>;

    /**
     * Validates url path
     * @example
     * cy.sa_urlShouldContain('/detector-details')
     */
    sa_urlShouldContain(path: string): Chainable<any>;

    /**
     * Validates table items
     * @example
     * cy.sa_validateTable('/detector-details')
     */
    sa_validateTable(data: { [key: string]: string }[]): Chainable<any>;

    /**
     * Removes custom indices, detectors and rules
     * @example
     * cy.sa_cleanUpTests()
     */
    sa_cleanUpTests(): Chainable<any>;

    /**
     * Returns table first row
     * Finds elements deeper in a row with selector
     * @param {string} selector
     * @example
     * cy.sa_getTableFirstRow()
     * cy.sa_getTableFirstRow('td')
     */
    sa_getTableFirstRow(selector: string): Chainable<any>;

    /**
     * Waits for page to be loaded
     * @param {string} pathname
     * @param {any} opts
     * @example
     * cy.sa_waitForPageLoad('detectors')
     * cy.sa_waitForPageLoad('detectors', {
     *   timeout: 20000,
     *   contains: 'text to verify'
     * })
     */
    sa_waitForPageLoad(pathname: string, opts?: any): Chainable<any>;

    /**
     * Returns table first row
     * Can find elements deeper in a row with selector
     * @param {string} text
     * @example
     * cy.get('selector').sa_ospSearch('Txt to write into input')
     */
    sa_ospSearch(text: string): Chainable<any>;

    /**
     * Clears input text
     * @example
     * cy.get('selector').sa_ospClear()
     */
    sa_ospClear(): Chainable<any>;

    /**
     * Returns table first row
     * Can find elements deeper in a row with selector
     * @param {string} text
     * @example
     * cy.get('selector').sa_ospType('Txt to write into input')
     */
    sa_ospType(text: string): Chainable<any>;

    /**
     * Creates index with optional settings
     * @example
     * cy.sa_createIndex("some_index", settingObj)
     */
    sa_createIndex(index: string, settings?: object): Chainable<any>;

    /**
     * Creates an index template.
     * @example
     * cy.sa_createIndexTemplate("some_index_template", { "index_patterns": "abc", "properties": { ... } })
     */
    sa_createIndexTemplate(name: string, template: object): Chainable<any>;

    /**
    /**
     * Deletes all indices in cluster
     * @example
     * cy.sa_deleteAllIndices()
     */
    sa_deleteAllIndices(): Chainable<any>;

    /**
     * Deletes all custom rules in cluster
     * @example
     * cy.sa_deleteAllCustomRules()
     */
    sa_deleteAllCustomRules(): Chainable<any>;

    /**
     * Deletes all detectors in cluster
     * @example
     * cy.sa_deleteAllDetectors()
     */
    sa_deleteAllDetectors(): Chainable<any>;

    /**
     * Creates a detector
     * @example
     * cy.sa_createPolicy({ "detector_type": ... })
     */
    sa_createDetector(detectorJSON: object): Chainable<any>;

    /**
     * Creates a fields mapping aliases for detector
     * @example
     * cy.sa_createAliasMappings('indexName', 'windows', {...}, true)
     */
    sa_createAliasMappings(
      indexName: string,
      ruleTopic: string,
      aliasMappingsBody: object,
      partial: boolean
    ): Chainable<any>;

    /**
     * Creates a custom rule
     * @example
     * cy.sa_createRule({})
     */
    sa_createRule(ruleJSON: object): Chainable<any>;

    /**
     * Updates settings for index
     * @example
     * cy.sa_updateIndexSettings("some_index", settings)
     */
    sa_updateDetector(detectorId: string, detectorJSON: object): Chainable<any>;

    /**
     * Deletes detector by its name
     * @example
     * cy.sa_deleteDetector("Cypress detector name")
     */
    sa_deleteDetector(name: string): Chainable<any>;
  }
}
