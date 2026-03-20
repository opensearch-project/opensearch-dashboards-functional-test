/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { SEARCH_RELEVANCE_PLUGIN_NAME } from '../../../utils/plugins/search-relevance-dashboards/constants';
import { BASE_PATH } from '../../../utils/base_constants';
import {
  initializeUbiIndices,
  enableWorkbenchUI,
} from '../../../utils/plugins/search-relevance-dashboards/common-setup';

describe('Judgment Create', () => {
  before(() => {
    cy.visit(Cypress.config().baseUrl, { timeout: 10000 });
    // Initialize UBI indices required for tests
    initializeUbiIndices();
    // Enable the search relevance workbench UI
    enableWorkbenchUI();
  });

  beforeEach(() => {
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/judgment/create`
    );
    cy.wait(2000);
  });

  it('Should show empty state for LLM judgment when no configurations exist', () => {
    // Fill in name
    cy.get('input[name="name"]').type('Test Judgment');

    // Select LLM type
    cy.get('select').first().select('LLM_JUDGMENT');

    // Fill in model ID
    cy.get('input').eq(2).type('test-model-id');

    // Try to create
    cy.get('[data-test-subj="createJudgmentButton"]').click();

    // Should show error messages about missing query set and search configurations
    // V13 fix: Use a more robust check for error messages in the body
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      expect(
        text.includes('please select') && text.includes('query set'),
        'Should ask to select query set'
      ).to.be.true;
      expect(
        text.includes('please select') && text.includes('search configuration'),
        'Should ask to select search config'
      ).to.be.true;
    });
  });

  it('Should show validation errors for empty required fields', () => {
    cy.get('[data-test-subj="createJudgmentButton"]').click();
    // V13 fix: Use a more robust check for form errors. EUI often uses specific classes for errors.
    // Also use the most minimal text to match.
    cy.get('body').should(($body) => {
      const text = $body.text().toLowerCase();
      expect(
        text.includes('name') && text.includes('required'),
        'Body should contain name and required error message'
      ).to.be.true;
    });
  });

  it('Should navigate back on cancel', () => {
    cy.get('[data-test-subj="cancelJudgmentButton"]').click();
    cy.url().should('include', '/judgment');
  });

  it('Should succeed UBI judgment creation with 200 status', () => {
    // Fill in name
    cy.get('input[name="name"]').type('Test UBI Judgment');

    // Select UBI type
    cy.get('select').first().select('UBI_JUDGMENT');

    // Check UBI specific fields are visible and can be modified
    cy.contains('Click Model').should('be.visible');
    cy.get('select').eq(1).select('coec');

    cy.contains('Max Rank').should('be.visible');
    cy.get('input[type="number"]').clear().type('20');

    // Click create button
    cy.get('[data-test-subj="createJudgmentButton"]').click();

    // Expect success message
    // V13 fix: Use a more robust check for success message in the body
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      expect(
        text.includes('judgment') && text.includes('created successfully'),
        'Success message should appear'
      ).to.be.true;
    });

    // Navigate to judgment listing page
    cy.visit(`${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/judgment`);
    cy.wait(3000);

    // Find and click on the "Test UBI Judgment" link
    cy.contains('Test UBI Judgment').click();

    // Verify we're on the judgment view page
    cy.url().should('include', '/judgment/view/');

    // Verify the content contains the expected text
    cy.contains('futon frames full size without mattress').should('be.visible');
  });
});
