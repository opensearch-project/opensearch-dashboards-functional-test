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
      .type(`${field}{downArrow}{enter}`).trigger('blur', { force: true });
    // cy.contains('button', field)
    //   .click()

    cy.getElementByTestId('filterOperatorList')
      .should('be.visible')
      .click()
      .type(`${operator}{downArrow}{enter}`).trigger('blur', { force: true });
    // cy.get('.globalFilterItem__editorForm')
    //   .contains('button', operator)
    //   .click()
    
      if(value){
        cy.get('[data-test-subj~="filterParamsComboBox"]')
        .should('be.visible')
        .click()
        .type(`${value}{downArrow}{enter}`).trigger('blur', { force: true });
      // cy.contains('button', value)
      //   .click()
      }
    

    cy.getElementByTestId('saveFilter')
      .click({force:true})
    cy.waitForLoader()
})

Cypress.Commands.add('saveQuery', (name, description) => {
    cy.whenTestIdNotFound('saved-query-management-popover', () => {
        cy.getElementByTestId('saved-query-management-popover-button')
          .click()
    })
    cy.getElementByTestId('saved-query-management-save-button')
      .click()
    
    cy.getElementByTestId('saveQueryFormTitle')
      .type(name)
    cy.getElementByTestId('saveQueryFormDescription')
      .type(description)
})

Cypress.Commands.add(`importJSONDoc`, (index, filePath) => {

})
