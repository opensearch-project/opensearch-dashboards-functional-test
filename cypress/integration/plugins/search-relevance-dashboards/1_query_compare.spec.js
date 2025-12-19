/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  SEARCH_RELEVANCE_PLUGIN_NAME,
  SAMPLE_INDEX,
  SAMPLE_SEARCH_TEXT,
  SAMPLE_QUERY_TEXT,
  NO_RESULTS,
} from '../../../utils/plugins/search-relevance-dashboards/constants';
import { BASE_PATH } from '../../../utils/base_constants';

describe('Compare queries', () => {
  before(() => {
    // visit base url
    cy.visit(Cypress.config().baseUrl, { timeout: 10000 });
    cy.deleteAllIndices();
    // Use API-based sample data loading instead of UI-based approach
    cy.loadSampleData('ecommerce');
    cy.loadSampleData('flights');
    cy.loadSampleData('logs');
    cy.wait(10000);
  });

  after(() => {
    // Remove sample data via API
    cy.request({
      method: 'DELETE',
      headers: { 'osd-xsrf': 'opensearch-dashboards' },
      url: `${BASE_PATH}/api/sample_data/ecommerce`,
      failOnStatusCode: false,
    });
    cy.request({
      method: 'DELETE',
      headers: { 'osd-xsrf': 'opensearch-dashboards' },
      url: `${BASE_PATH}/api/sample_data/flights`,
      failOnStatusCode: false,
    });
    cy.request({
      method: 'DELETE',
      headers: { 'osd-xsrf': 'opensearch-dashboards' },
      url: `${BASE_PATH}/api/sample_data/logs`,
      failOnStatusCode: false,
    });
  });

  it('Should get comparison results', () => {
    cy.visit(`${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}`);

    // Check for euiCard with fail-safe
    cy.get('body').then(($body) => {
      if ($body.find('.euiCard').length > 0) {
        cy.visit(
          `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/experiment/create/singleQueryComparison`
        );
        cy.wait(10000);
      }
    });
    // Type search text in search box
    cy.get('input[type="search"]').type(SAMPLE_SEARCH_TEXT, {
      force: true,
    });

    // Select index 1
    cy.get('div.search-relevance-config:nth-child(1) select').select(
      SAMPLE_INDEX
    );
    // Select index 2
    cy.get('div.search-relevance-config:nth-child(2) select').select(
      SAMPLE_INDEX
    );

    // Type query 1
    cy.get(
      'div.search-relevance-config:nth-child(1) div[data-test-subj="codeEditorContainer"]'
    ).type(SAMPLE_QUERY_TEXT, {
      parseSpecialCharSequences: false,
    });
    // Type query 2
    cy.get(
      'div.search-relevance-config:nth-child(2) div[data-test-subj="codeEditorContainer"]'
    ).type(SAMPLE_QUERY_TEXT, {
      parseSpecialCharSequences: false,
    });

    // Click search button
    cy.get('button[aria-label="searchRelevance-searchButton"]').click({
      force: true,
    });

    // Confirm get results on both result panel
    cy.get(
      '.search-relevance-result-panel:nth-child(1) > div > div:nth-child(2) > h2'
    ).should('not.equal', NO_RESULTS);
    cy.get(
      '.search-relevance-result-panel:nth-child(2) > div > div:nth-child(2) > h2'
    ).should('not.equal', NO_RESULTS);
  });
});
