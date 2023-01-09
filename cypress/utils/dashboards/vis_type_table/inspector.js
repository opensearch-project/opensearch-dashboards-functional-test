/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Cypress.Commands.add('tbOpenInspector', () => {
  cy.getElementByTestId('openInspectorButton').click();
});

Cypress.Commands.add('tbCloseInspector', () => {
  cy.getElementByTestId('euiFlyoutCloseButton').click();
});

Cypress.Commands.add('tbGetTableDataFromInspectPanel', () => {
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
