/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TABLE_OPTIONS, TABLE_TOTAL_FUNCTIONS } from './constants';

Cypress.Commands.add('openOptionsPanel', () => {
  cy.getElementByTestId('visEditorTab__options').click();
});

Cypress.Commands.add('toggleOptionByName', (option, request) => {
  expect(option).to.be.oneOf(TABLE_OPTIONS);
  cy.getElementByTestId(option)
    .invoke('attr', 'aria-checked')
    .then((state) => {
      if (state !== request) {
        cy.getElementByTestId(option).click();
      }
    });
});

Cypress.Commands.add('selectTotalFunctionByName', (fun) => {
  expect(fun).to.be.oneOf(TABLE_TOTAL_FUNCTIONS);
  cy.getElementByTestId('showTotal')
    .invoke('attr', 'aria-checked')
    .should('eq', 'true');
  cy.getElementByTestId('totalFunctionOptions').select(fun);
});

Cypress.Commands.add('selectPercentageColumn', (agg) => {
  cy.getElementByTestId('datatableVisualizationPercentageCol').select(agg);
});
