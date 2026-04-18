/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { toTestId } from '../constants';

Cypress.Commands.add('verifyTimeConfig', (start, end) => {
  const opts = { log: false };

  cy.getElementByTestId('superDatePickerstartDatePopoverButton', opts)
    .should('be.visible')
    .should('have.text', start);

  cy.getElementByTestId('superDatePickerendDatePopoverButton', opts)
    .should('be.visible')
    .should('have.text', end);
});

Cypress.Commands.add('saveSearch', (name) => {
  cy.log('in func save search');
  const opts = { log: false };

  cy.getElementByTestId('discoverSaveButton', opts).click();
  cy.getElementByTestId('savedObjectTitle').clear().type(name);
  cy.getElementByTestId('confirmSaveSavedObjectButton').click({ force: true });

  // Wait for page to load
  cy.waitForLoader();
});

Cypress.Commands.add('loadSaveSearch', (name) => {
  const opts = {
    log: false,
    force: true,
  };

  cy.getElementByTestId('discoverOpenButton', opts).click(opts);
  cy.getElementByTestId(`savedObjectTitle${toTestId(name)}`).click();

  cy.waitForLoader();
});

Cypress.Commands.add('verifyHitCount', (count) => {
  cy.getElementByTestId('discoverQueryHits')
    .should('be.visible')
    .should('have.text', count);
});

Cypress.Commands.add('waitForSearch', () => {
  Cypress.log({
    name: 'waitForSearch',
    displayName: 'wait',
    message: 'search load',
  });

  // Wait for either doc table (results found) or no results message
  cy.get(
    '[data-test-subj="docTable"], [data-test-subj="discoverNoResults"], [data-test-subj="loadingSpinner"]',
    { timeout: 60000 }
  ).should('exist');

  // If spinner appeared, wait for it to go away
  cy.get('body').then(($body) => {
    if ($body.find('[data-test-subj="loadingSpinner"]').length) {
      cy.get('[data-test-subj="loadingSpinner"]', { timeout: 120000 }).should(
        'not.exist'
      );
    }
  });
});

Cypress.Commands.add('prepareTest', (fromTime, toTime, interval) => {
  cy.setTopNavDate(fromTime, toTime);
  cy.waitForLoader();
  cy.waitForSearch();
  cy.get('[data-test-subj="discoverIntervalSelect"]', {
    timeout: 30000,
  }).select(`${interval}`);
  cy.waitForLoader();
  cy.waitForSearch();
});

Cypress.Commands.add('verifyMarkCount', (count) => {
  cy.getElementByTestId('docTable').find('mark').should('have.length', count);
});

Cypress.Commands.add('submitFilterFromDropDown', (field, operator, value) => {
  cy.getElementByTestId('addFilter').click();
  cy.getElementByTestId('filterFieldSuggestionList')
    .filter(':visible')
    .first()
    .click()
    .type(`${field}{downArrow}{enter}`)
    .trigger('blur', { force: true });

  cy.getElementByTestId('filterOperatorList')
    .filter(':visible')
    .first()
    .click()
    .type(`${operator}{downArrow}{enter}`)
    .trigger('blur', { force: true });

  if (value) {
    cy.get('[data-test-subj^="filterParamsComboBox"]')
      .filter(':visible')
      .first()
      .click()
      .type(`${value}{downArrow}{enter}`)
      .trigger('blur', { force: true });
  }

  cy.getElementByTestId('saveFilter').first().click({ force: true });
  cy.waitForLoader();
});

Cypress.Commands.add('saveQuery', (name, description) => {
  cy.whenTestIdNotFound('saved-query-management-popover', () => {
    cy.getElementByTestId('saved-query-management-popover-button').click();
  });
  cy.getElementByTestId('saved-query-management-save-button').click();

  cy.getElementByTestId('saveQueryFormTitle').type(name);
  cy.getElementByTestId('saveQueryFormDescription').type(description);
});

Cypress.Commands.add('loadSaveQuery', (name) => {
  cy.getElementByTestId('saved-query-management-popover-button').click({
    force: true,
  });

  cy.get(`[data-test-subj~="load-saved-query-${name}-button"]`)
    .should('be.visible')
    .click();
});

Cypress.Commands.add('clearSaveQuery', () => {
  cy.whenTestIdNotFound('saved-query-management-popover', () => {
    cy.getElementByTestId('saved-query-management-popover-button').click();
  });
  //clear save queries
  cy.getElementByTestId('saved-query-management-clear-button').click();
});

Cypress.Commands.add('deleteSaveQuery', (name) => {
  cy.getElementByTestId('saved-query-management-popover-button').click();

  cy.get(`[data-test-subj~="delete-saved-query-${name}-button"]`).click({
    force: true,
  });
  cy.getElementByTestId('confirmModalConfirmButton').click();
});
