/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TABLE_OPTIONS, TABLE_TOTAL_FUNCTIONS } from './constants';

Cypress.Commands.add('tbOpenOptionsPanel', () => {
  cy.getElementByTestId('visEditorTab__options').click();
});

Cypress.Commands.add('tbToggleOptionByName', (option, request) => {
  expect(option).to.be.oneOf(TABLE_OPTIONS);
  cy.getElementByTestId(option)
    .invoke('attr', 'aria-checked')
    .then((state) => {
      if (state !== request) {
        cy.getElementByTestId(option).click();
      }
    });
});

Cypress.Commands.add('tbSelectTotalFunctionByName', (fun) => {
  expect(fun).to.be.oneOf(TABLE_TOTAL_FUNCTIONS);
  cy.getElementByTestId('showTotal')
    .invoke('attr', 'aria-checked')
    .should('eq', 'true');
  cy.getElementByTestId('totalFunctionOptions').select(fun);
});

Cypress.Commands.add('tbSelectPercentageColumn', (agg) => {
  cy.getElementByTestId('datatableVisualizationPercentageCol').select(agg);
});
