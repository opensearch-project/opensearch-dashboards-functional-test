/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
Cypress.Commands.add('tlSetTimelineExpression', (expression) => {
  cy.get('.react-monaco-editor-container textarea')
    .first()
    .click()
    .focused()
    .type('{ctrl}a')
    .type(expression, {
      delay: 0,
      parseSpecialCharSequences: false,
    });
});

Cypress.Commands.add('tlUpdateVisualization', () => {
  cy.contains('button', 'Update').click();
});
