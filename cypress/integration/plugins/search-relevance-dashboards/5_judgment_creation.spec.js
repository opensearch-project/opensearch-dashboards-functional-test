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
    cy.contains('Please select a query set');
    cy.contains('Please select at least one search configuration');
  });

  it('Should show validation errors for empty required fields', () => {
    cy.get('[data-test-subj="createJudgmentButton"]').click();
    cy.contains('Name is a required parameter.');
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
    cy.contains('Judgment created successfully', { timeout: 10000 });
  });
});
