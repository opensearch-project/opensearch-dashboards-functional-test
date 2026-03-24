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
    // Use API-based sample data loading to bypass modal popups on tutorial page
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
    // Navigate directly to single query comparison page
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/experiment/create/queryAnalysis`
    );
    cy.wait(5000);

    // Type search text in search box
    cy.get('#searchRelevance-searchBar', { timeout: 30000 }).type(
      SAMPLE_SEARCH_TEXT,
      {
        force: true,
      }
    );

    // Select index 1
    cy.get('[aria-label="Search Index"]').eq(0).select(SAMPLE_INDEX);
    // Select index 2
    cy.get('[aria-label="Search Index"]').eq(1).select(SAMPLE_INDEX);

    // Type query 1
    cy.get('[data-test-subj="queryEditor1"]').type(SAMPLE_QUERY_TEXT, {
      parseSpecialCharSequences: false,
    });
    // Type query 2
    cy.get('[data-test-subj="queryEditor2"]').type(SAMPLE_QUERY_TEXT, {
      parseSpecialCharSequences: false,
    });

    // Click search button
    cy.get('button[aria-label="searchRelevance-searchButton"]').click({
      force: true,
    });

    // Confirm get results on both result panel
    cy.get('.search-relevance-result-panel')
      .eq(0)
      .find('h2')
      .should('not.equal', NO_RESULTS);
    cy.get('.search-relevance-result-panel')
      .eq(1)
      .find('h2')
      .should('not.equal', NO_RESULTS);
  });
});
