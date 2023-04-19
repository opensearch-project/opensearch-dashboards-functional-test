/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

require('./detectors');
require('./rules');
require('./typings');

Cypress.Commands.add('cleanUpTests', () => {
  cy.deleteAllCustomRules();
  cy.deleteAllDetectors();
  cy.deleteAllIndices();
});

Cypress.Commands.add('getTableFirstRow', (selector) => {
  if (!selector) return cy.get('tbody > tr').first();
  return cy.get('tbody > tr:first').find(selector);
});
