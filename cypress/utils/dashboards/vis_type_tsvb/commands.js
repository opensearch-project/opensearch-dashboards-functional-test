/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { TSVB_INDEX_PATTERN } from './constants';

Cypress.Commands.add('tsvbSaveVisualization', () => {
  cy.contains('button', 'Save').click();
  // Type in a random name into the input field
  cy.get('[data-test-subj="savedObjectTitle"]').type(TSVB_INDEX_PATTERN);
  // Click the button with data-test-subj="confirmSaveSavedObjectButton"
  cy.get('[data-test-subj="confirmSaveSavedObjectButton"]').click();
});
