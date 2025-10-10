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
  prepareSampleIndex,
} from '../../../utils/plugins/search-relevance-dashboards/common-setup';

describe('Experiment Create', () => {
  before(() => {
    cy.visit(Cypress.config().baseUrl, { timeout: 10000 });
    // Initialize UBI indices required for tests
    initializeUbiIndices();
    // Enable the search relevance workbench UI
    enableWorkbenchUI();
    prepareSampleIndex();

    // Generate unique names with timestamp
    const timestamp = new Date().getTime();
    const querySetName = `QS_Test_${timestamp}`;
    const configName1 = `Config1_${timestamp}`;
    const configName2 = `Config2_${timestamp}`;
    const judgmentName = `UBI_Judgment_${timestamp}`;

    // Store names in Cypress environment variables for later use
    Cypress.env('querySetName', querySetName);
    Cypress.env('configName1', configName1);
    Cypress.env('configName2', configName2);
    Cypress.env('judgmentName', judgmentName);

    // Create a query set for testing
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/querySet/create`
    );
    cy.wait(3000);
    cy.waitForLoader();

    // Use textarea selector with longer timeout
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .first()
      .focus()
      .type(querySetName);
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .last()
      .focus()
      .type('Test Query Set Description');
    cy.get('[data-test-subj="querySetSamplingSelect"]').select('random');
    cy.get('[data-test-subj="createQuerySetButton"]').click();
    cy.contains(`Query set "${querySetName}" created successfully`, {
      timeout: 10000,
    });

    // Create first search configuration for testing
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/searchConfiguration/create`
    );
    cy.wait(3000);
    cy.waitForLoader();

    cy.get('[data-test-subj="searchConfigurationNameInput"]').type(configName1);
    cy.get('[data-test-subj="codeEditorContainer"]').click();
    cy.get('.ace_text-input').type('{ "query": { "match_all": {} } }', {
      parseSpecialCharSequences: false,
    });
    cy.get('[data-test-subj="comboBoxInput"]').first().click();
    cy.contains('.euiComboBoxOption__content', '00sample_index').click();
    cy.get('[data-test-subj="createSearchConfigurationButton"]').click();
    cy.contains(`Search configuration "${configName1}" created successfully`, {
      timeout: 10000,
    });

    // Create second search configuration
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/searchConfiguration/create`
    );
    cy.wait(3000);
    cy.waitForLoader();

    cy.get('[data-test-subj="searchConfigurationNameInput"]').type(configName2);
    cy.get('[data-test-subj="codeEditorContainer"]').click();
    cy.get('.ace_text-input').type('{ "query": { "match_all": {} } }', {
      parseSpecialCharSequences: false,
    });
    cy.get('[data-test-subj="comboBoxInput"]').first().click();
    cy.contains('.euiComboBoxOption__content', '00sample_index').click();
    cy.get('[data-test-subj="createSearchConfigurationButton"]').click();
    cy.contains(`Search configuration "${configName2}" created successfully`, {
      timeout: 10000,
    });

    // Create a judgment for testing
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/judgment/create`
    );
    cy.wait(3000);
    cy.waitForLoader();

    cy.get('input[name="name"]').type(judgmentName);
    cy.get('select').first().select('UBI_JUDGMENT');
    cy.get('select').eq(1).select('coec');
    cy.get('input[type="number"]').clear().type('20');
    cy.get('[data-test-subj="createJudgmentButton"]').click();
    cy.contains(`Judgment created successfully`, { timeout: 10000 });
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

  it('Should create a query set comparison experiment', () => {
    // Get stored resource names from environment variables
    const querySetName = Cypress.env('querySetName');
    const configName1 = Cypress.env('configName1');
    const configName2 = Cypress.env('configName2');

    // Navigate to query set comparison page
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/experiment/create/querySetComparison`
    );
    cy.wait(3000);
    cy.waitForLoader();

    // Select query set from dropdown
    cy.get('[data-test-subj="comboBoxInput"]').first().click();
    cy.contains('.euiComboBoxOption__content', querySetName).click();

    // Select search configurations
    cy.get('[data-test-subj="comboBoxInput"]').eq(1).click();
    cy.contains('.euiComboBoxOption__content', configName1).click();

    cy.get('[data-test-subj="comboBoxInput"]').eq(1).click();
    cy.contains('.euiComboBoxOption__content', configName2).click();

    // Click start evaluation button
    cy.contains('button', 'Start Evaluation').click();

    // Verify success
    cy.contains('created successfully', { timeout: 10000 });
  });

  it('Should create a search evaluation experiment', () => {
    // Get stored resource names from environment variables
    const querySetName = Cypress.env('querySetName');
    const configName1 = Cypress.env('configName1');
    const judgmentName = Cypress.env('judgmentName');

    // Navigate to search evaluation page
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/experiment/create/searchEvaluation`
    );
    cy.wait(3000);
    cy.waitForLoader();

    // Select query set from dropdown
    cy.get('[data-test-subj="comboBoxInput"]').first().click();
    cy.wait(500);
    cy.contains('.euiComboBoxOption__content', querySetName).click();

    // Select search configuration
    cy.get('[data-test-subj="comboBoxInput"]').eq(1).click();
    cy.wait(500);
    cy.contains('.euiComboBoxOption__content', configName1).click();
    cy.get('h2').first().click(); // Click on a blank area to close dropdown
    cy.wait(500); // Wait for dropdown to close

    // Select judgment
    cy.get('[data-test-subj="comboBoxInput"]').eq(2).click();
    cy.wait(500);
    cy.contains('.euiComboBoxOption__content', judgmentName).click();

    // Click start evaluation button
    cy.contains('button', 'Start Evaluation').click();

    // Verify success
    cy.contains('created successfully', { timeout: 10000 });
  });
});
