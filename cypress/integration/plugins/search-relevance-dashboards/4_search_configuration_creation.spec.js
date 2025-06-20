/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { SEARCH_RELEVANCE_PLUGIN_NAME } from '../../../utils/plugins/search-relevance-dashboards/constants';
import { BASE_PATH } from '../../../utils/base_constants';

describe('Search Configuration Create', () => {
  before(() => {
    cy.visit(Cypress.config().baseUrl, { timeout: 10000 });
    const miscUtils = new MiscUtils(cy);
    miscUtils.visitPage('app/management/opensearch-dashboards/settings');
    cy.waitForLoader();

    // Check current state of the toggle
    cy.get(
      'button[role="switch"][data-test-subj="advancedSetting-editField-search-relevance:experimental_workbench_ui_enabled"]',
      { timeout: 30000 }
    ).then(($button) => {
      const isEnabled = $button.attr('aria-checked') === 'true';

      // Only click if not already enabled
      if (!isEnabled) {
        cy.wrap($button).click({ force: true });
        cy.get('[data-test-subj="advancedSetting-saveButton"]').click({
          force: true,
        });
        cy.wait(10000);
      }
    });
  });

  it('Should display the search configuration create page', () => {
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/searchConfiguration/create`
    );
    cy.wait(3000);
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

  it('Should fail search configuration creation with Forbidden error', () => {
    // Fill in name
    cy.get('[data-test-subj="searchConfigurationNameInput"]').type(
      'Test Configuration'
    );

    // Fill in query using the code editor
    cy.get('[data-test-subj="codeEditorContainer"]').click();
    cy.get('.ace_text-input').type('{ "query": { "match_all": {} } }', {
      parseSpecialCharSequences: false,
    });

    // Select an index from combo box
    cy.get('[data-test-subj="comboBoxInput"]').first().click();
    cy.get('.euiComboBoxOption__content').first().click();

    // Click create button
    cy.get('[data-test-subj="createSearchConfigurationButton"]').click();

    // Expect Forbidden error
    cy.contains('Failed to create search configuration');
    cy.contains('Forbidden');
  });

  it('Should navigate back on cancel', () => {
    // Click cancel button
    cy.get('[data-test-subj="cancelSearchConfigurationButton"]').click();

    // Verify navigation
    cy.url().should('include', '/searchConfiguration');
  });
});
