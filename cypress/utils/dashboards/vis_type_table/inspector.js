/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Cypress.Commands.add('openInspector', () => {
  cy.getElementByTestId('openInspectorButton').click();
});

Cypress.Commands.add('closeInspector', () => {
  cy.getElementByTestId('euiFlyoutCloseButton').click();
});

Cypress.Commands.add('getTableDataFromInspectPanel', () => {
  let data = [];
  cy.get('[class="euiTableRowCell"]')
    .find('[class="euiFlexItem euiFlexItem--flexGrowZero"]')
    .each(($cell) => {
      const txt = $cell.text();
      if (txt !== '') {
        cy.log(txt);
        data.push(txt);
      }
    });
  return cy.wrap(data);
});
