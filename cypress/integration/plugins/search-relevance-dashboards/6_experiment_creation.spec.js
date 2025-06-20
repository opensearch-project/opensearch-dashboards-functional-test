/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { SEARCH_RELEVANCE_PLUGIN_NAME } from '../../../utils/plugins/search-relevance-dashboards/constants';
import { BASE_PATH } from '../../../utils/base_constants';

describe('Experiment Create', () => {
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

  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}`);
    cy.wait(2000);
  });

  it('Should display all four experiment template cards', () => {
    // Check that there are exactly 4 cards
    cy.get('.euiCard').should('have.length', 4);

    // Verify each card's title
    cy.contains('.euiCard', 'Single Query Comparison').should('exist');
    cy.contains('.euiCard', 'Query Set Comparison').should('exist');
    cy.contains('.euiCard', 'Search Evaluation').should('exist');
    cy.contains('.euiCard', 'Hybrid Search Optimizer').should('exist');
  });

  it('Should display correct descriptions for each card', () => {
    // Verify card descriptions
    cy.contains('Test two search configurations with a single query').should(
      'exist'
    );
    cy.contains('Perform a comparison across an entire set of queries').should(
      'exist'
    );
    cy.contains('Calculate search quality metrics').should('exist');
    cy.contains(
      'Find the best balance between neural and lexical hybrid search'
    ).should('exist');
  });

  it('Should display beaker icons for all cards', () => {
    // Check that all cards have the beaker icon
    cy.get('.euiCard .euiIcon').should('have.length', 4);
  });

  it('Should navigate to correct routes when clicked', () => {
    // Click Single Query Comparison card and verify navigation
    cy.contains('.euiCard', 'Single Query Comparison').click();
    cy.url().should('include', '/experiment/create/singleQueryComparison');

    // Navigate back and test other cards
    cy.go('back');

    cy.contains('.euiCard', 'Query Set Comparison').click();
    cy.url().should('include', '/experiment/create/querySetComparison');

    cy.go('back');

    cy.contains('.euiCard', 'Search Evaluation').click();
    cy.url().should('include', '/experiment/create/searchEvaluation');

    cy.go('back');

    cy.contains('.euiCard', 'Hybrid Search Optimizer').click();
    cy.url().should('include', '/experiment/create/hybridOptimizer');
  });
});
