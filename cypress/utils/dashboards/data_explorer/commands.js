/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { toTestId } from "../constants";

Cypress.Commands.add('verifyTimeConfig', (start, end) => {
  const opts = { log: false };

  cy.getElementByTestId('superDatePickerstartDatePopoverButton', opts)
    .should('be.visible')
    .should('have.text', start)
    
  cy.getElementByTestId('superDatePickerendDatePopoverButton', opts)
    .should('be.visible')
    .should('have.text', end)
});

Cypress.Commands.add('saveSearch', (name) => {
    cy.log("in func save search")
    const opts = { log: false}

    cy.get('discoverSaveButton', opts)
      .click()
      cy.log("in func save search 1")
    cy.getElementByTestId('savedObjectTitle').type(name);
    cy.getElementByTestId('confirmSaveSavedObjectButton').click();

    // Wait for page to load
    cy.waitForLoader();
})

Cypress.Commands.add('loadSaveSearch', (name) => {
    const opts = { log: false}

    cy.getElementByTestId('discoverOpenButton', opts)
      .click(opts)
    cy.getElementByTestId(
      `savedObjectTitle${toTestId(name)}`
    ).click();

    cy.waitForLoader()
})

Cypress.Commands.add('verifyHitCount', (count) => {
    cy.getElementByTestId('discoverQueryHits')
      .should('be.visible')
      .should('have.text', count)
})

Cypress.Commands.add('waitForSearch', () => {
    Cypress.log({
      name: 'waitForSearch',
      displayName: 'wait',
      message: 'search load',
    });
  
    cy.getElementByTestId('docTable');
  });

Cypress.Commands.add('prepareTest', (fromTime, toTime, interval) => {
    cy.setTopNavDate(fromTime, toTime)
    // wait until the search has been finished
    cy.waitForSearch()
    cy.get('select')
      .select(`${interval}`)
    cy.waitForLoader()
})

Cypress.Commands.add('isChartCanvasExist', () => {
    cy.get('.echChart canvas:last-of-type')
      .should('be.visible')
})

Cypress.Commands.add('isChartIntervalWarningIconExist', () => {
    cy.waitForLoader()
    cy.get('.euiToolTipAnchor')
      .should('be.visible')
})

Cypress.Commands.add('submitQuery', (query) => {
    cy.log(`QueryBar.setQuery(${query})`)
    cy.getElementByTestId('queryInput')
      .clear()
      .type(query)
      .type('Cypress.io{enter}')
    cy.waitForLoader()
})

Cypress.Commands.add('verifyMarkCount', (count) => {
    cy.getElementByTestId('docTable')
      .find('mark')
      .should('have.length', count)
})

Cypress.Commands.add('submitFilterFromDropDown', (field, operator, value) => {
    cy.getElementByTestId('addFilter')
      .click()
    cy.getElementByTestId('filterFieldSuggestionList')
      .should('be.visible')
      .click()
    cy.contains('button', field)

    cy.getElementByTestId('filterOperatorList')
      .should('be.visible')
      .click()
    cy.contains('button', operator)

    cy.get('[data-test-subj~="filterParamsComboBox"]')
      .should('be.visible')
      .click()
    cy.contains('button', value)

    cy.getElementByTestId('saveFilter')
      .click()
    cy.waitForLoader()
})
