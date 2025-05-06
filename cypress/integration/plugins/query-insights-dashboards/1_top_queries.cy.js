/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import sampleDocument from '../../../fixtures/plugins/query-insights-dashboards/sample_document.json';
import { QUERY_INSIGHTS_METRICS } from '../../../utils/constants';

// Name of the test index used in tests
const indexName = 'sample_index';

/**
  Helper function to clean up the environment:
  - Deletes the test index.
  - Disables the top queries features.
 */
const clearAll = () => {
  cy.deleteIndexByName(indexName);
  cy.disableTopQueries(QUERY_INSIGHTS_METRICS.LATENCY);
  cy.disableTopQueries(QUERY_INSIGHTS_METRICS.CPU);
  cy.disableTopQueries(QUERY_INSIGHTS_METRICS.MEMORY);
};

describe('Query Insights Dashboard', () => {
  // Setup before each test
  beforeEach(() => {
    clearAll();
    cy.createIndexByName(indexName, sampleDocument);
    cy.enableTopQueries(QUERY_INSIGHTS_METRICS.LATENCY);
    cy.enableTopQueries(QUERY_INSIGHTS_METRICS.CPU);
    cy.enableTopQueries(QUERY_INSIGHTS_METRICS.MEMORY);
    cy.searchOnIndex(indexName);
    // wait for 1s to avoid same timestamp
    cy.wait(1000);
    cy.searchOnIndex(indexName);
    cy.wait(1000);
    cy.searchOnIndex(indexName);
    // waiting for the query insights queue to drain
    cy.wait(10000);
    cy.navigateToOverview();
  });

  /**
   * Validate the main overview page loads correctly
   */
  it('should display the main overview page', () => {
    cy.get('.euiBasicTable').should('be.visible');
    cy.contains('Query insights - Top N queries');
    cy.url().should('include', '/queryInsights');

    // should display the query table on the overview page
    cy.get('.euiBasicTable').should('be.visible');
    cy.get('.euiTableHeaderCell').should('have.length.greaterThan', 0);
    // should have top n queries displayed on the table
    cy.get('.euiTableRow').should('have.length.greaterThan', 0);
  });

  it('should switch between tabs', () => {
    // Click Configuration tab
    cy.getElementByText('.euiTab', 'Configuration').click({ force: true });
    cy.contains('Query insights - Configuration');
    cy.url().should('include', '/configuration');

    // Click back to Query Insights tab
    cy.getElementByText('.euiTab', 'Top N queries').click({ force: true });
    cy.url().should('include', '/queryInsights');
  });

  it('should filter queries', () => {
    cy.get('.euiFieldSearch').should('be.visible');
    cy.get('.euiFieldSearch').type('sample_index');
    // Add assertions for filtered results
    cy.get('.euiTableRow').should('have.length.greaterThan', 0);
  });

  it('should clear the search input and reset results', () => {
    cy.get('.euiFieldSearch').type('random_string');
    cy.get('.euiTableRow').should('have.length.greaterThan', 0);
    cy.get('.euiFieldSearch').clear();
    cy.get('.euiTableRow').should('have.length.greaterThan', 0); // Validate reset
  });

  it('should display a message when no top queries are found', () => {
    clearAll(); // disable top n queries
    // waiting for the query insights queue to drain
    cy.wait(10000);
    cy.reload();
    cy.contains('No items found');
  });

  after(() => clearAll());
});
