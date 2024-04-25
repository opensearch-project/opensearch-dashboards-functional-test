/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Cypress.Commands.add('getVisibleTextFromAceEditor', (editorSelector) => {
  return cy
    .getElementByTestId(editorSelector)
    .find('.ace_line_group')
    .then((lines) => {
      const linesText = [...lines].map((line) => line.innerText);
      return linesText.join('\n');
    });
});

Cypress.Commands.add('changeConsoleFontSize', (size) => {
  cy.getElementByTestId('consoleSettingsButton').click({ force: true });
  // Ensure the settings panel is open and ready
  cy.getElementByTestId('setting-font-size-input', { timeout: 1000 })
    .type('{selectall}')
    .type(size)
    .should('have.value', size);
  cy.get('[data-test-subj="settings-save-button"]').click();
});
