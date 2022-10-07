/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Cypress.Commands.add('vbSelectDataSource', (dataSource) => {
  const opts = { log: false };

  Cypress.log({
    name: 'visualization builder select Data Source',
    displayName: 'set source',
    message: dataSource,
  });

  cy.getElementByTestId('searchableDropdownValue', opts).click(opts);
  cy.getElementByTestId('searchableDropdownList', opts)
    .find('ul > li', opts)
    .contains(dataSource, opts)
    .click(opts);
});

Cypress.Commands.add('vbSelectVisType', (type) => {
  const opts = { log: false };

  Cypress.log({
    name: 'visualization builder select Visualization Type',
    displayName: 'set visType',
    message: type,
  });

  cy.getElementByTestId('chartPicker', opts).click(opts);
  cy.get('[data-test-subj^=visType-', opts).contains(type, opts).click(opts);
  cy.getElementByTestId('confirmModalConfirmButton', opts).click(opts);
});
