/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
Cypress.Commands.add('vegaSetVegaSpec', (spec) => {
  const stringifiedSpec = JSON.stringify(spec);
  cy.get('.ace_text-input')
    .first()
    .focus()
    .clear()
    .focus()
    .type(stringifiedSpec, {
      delay: 0,
      parseSpecialCharSequences: false,
    });
});

Cypress.Commands.add('vegaUpdateVisualization', () => {
  cy.contains('button', 'Update').click();
});
