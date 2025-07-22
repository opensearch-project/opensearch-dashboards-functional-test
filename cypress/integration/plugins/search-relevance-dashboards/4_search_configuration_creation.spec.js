/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { SEARCH_RELEVANCE_PLUGIN_NAME } from '../../../utils/plugins/search-relevance-dashboards/constants';
import { BASE_PATH } from '../../../utils/base_constants';
import {
  enableWorkbenchUI,
  prepareSampleIndex,
} from '../../../utils/plugins/search-relevance-dashboards/common-setup';

describe('Search Configuration Create', () => {
  before(() => {
    cy.visit(Cypress.config().baseUrl, { timeout: 10000 });
    // Enable the search relevance workbench UI
    enableWorkbenchUI();
    prepareSampleIndex();
  });

  beforeEach(() => {
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/searchConfiguration/create`
    );
    cy.wait(2000);
  });

  it('Should display the search configuration create page', () => {
    cy.contains('Search Configuration');
    cy.contains(
      'Configure a new search configuration that represents all the aspects of an algorithm.'
    );
  });

  it('Should show validation errors for empty required fields', () => {
    cy.get('[data-test-subj="createSearchConfigurationButton"]').click();
    cy.contains('Search Configuration Name is a required parameter.');
    cy.contains('Query is required.');
  });

  it('Should succeed search configuration creation with 200 status', () => {
    // Fill in name
    cy.get('[data-test-subj="searchConfigurationNameInput"]').type(
      'Test Configuration'
    );

    // Fill in query using the code editor
    cy.get('[data-test-subj="codeEditorContainer"]').click();
    cy.get('.ace_text-input').type('{ "query": { "match_all": {} } }', {
      parseSpecialCharSequences: false,
    });

    // Select sample_index index from combo box
    cy.get('[data-test-subj="comboBoxInput"]').first().click();
    cy.contains('.euiComboBoxOption__content', '00sample_index').click();

    // Click create button
    cy.get('[data-test-subj="createSearchConfigurationButton"]').click();

    // Expect success message
    cy.contains(
      'Search configuration "Test Configuration" created successfully',
      { timeout: 10000 }
    );
  });

  it('Should navigate back on cancel', () => {
    // Click cancel button
    cy.get('[data-test-subj="cancelSearchConfigurationButton"]').click();

    // Verify navigation
    cy.url().should('include', '/searchConfiguration');
  });
});
