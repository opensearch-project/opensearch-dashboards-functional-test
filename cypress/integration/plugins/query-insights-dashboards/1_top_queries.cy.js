/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import sampleDocument from '../../../fixtures/plugins/query-insights-dashboards/sample_document.json';
import { METRICS } from '../../../utils/plugins/query-insights-dashboards/constants';

// Name of the test index used in tests
const indexName = 'sample_index';

/**
 Helper function to clean up the environment:
 - Deletes the test index.
 - Disables the top queries features.
 */
const clearAll = () => {
  cy.deleteIndexByName(indexName);
  cy.disableTopQueries(METRICS.LATENCY);
  cy.disableTopQueries(METRICS.CPU);
  cy.disableTopQueries(METRICS.MEMORY);
  cy.disableGrouping();
};

describe('Query Insights Dashboard', () => {
  // Setup before each test
  beforeEach(() => {
    clearAll();
    cy.createIndexByName(indexName, sampleDocument);
    cy.enableTopQueries(METRICS.LATENCY);
    cy.enableTopQueries(METRICS.CPU);
    cy.enableTopQueries(METRICS.MEMORY);
    cy.searchOnIndex(indexName);
    // wait for 1s to avoid same timestamp
    cy.wait(1000);
    cy.searchOnIndex(indexName);
    cy.wait(1000);
    cy.searchOnIndex(indexName);
    // waiting for the query insights queue to drain
    cy.wait(10000);
    cy.waitForQueryInsightsPlugin();
  });

  /**
   * Validate the main overview page loads correctly
   */
  it('should display the main overview page', () => {
    // Verify the page title is visible (already loaded by waitForQueryInsightsPlugin)
    cy.contains('Query insights - Top N queries').should('be.visible');

    // Verify the URL is correct
    cy.url().should('include', '/queryInsights');

    // Verify the table is visible and has content
    cy.get('.euiBasicTable').should('be.visible');
    cy.get('.euiTableHeaderCell').should('have.length.greaterThan', 0);

    // Verify there are query rows in the table
    cy.get('.euiTableRow').should('have.length.greaterThan', 0);
  });

  /**
   * Validate sorting by the "Timestamp" column works correctly
   */
  it('should sort the table by the Timestamp column', () => {
    // waiting for the query insights queue to drain
    cy.wait(10000);
    cy.navigateToOverview();
    // Click the Timestamp column header to sort
    cy.get('.euiTableHeaderCell').contains('Timestamp').click();
    // eslint-disable-next-line jest/valid-expect-in-promise
    cy.get('.euiTableRow')
      .first()
      .invoke('text')
      .then((firstRowAfterSort) => {
        const firstTimestamp = firstRowAfterSort.trim();
        cy.get('.euiTableHeaderCell').contains('Timestamp').click();
        // eslint-disable-next-line jest/valid-expect-in-promise
        cy.get('.euiTableRow')
          .first()
          .invoke('text')
          .then((firstRowAfterSecondSort) => {
            expect(firstRowAfterSecondSort.trim()).to.not.equal(firstTimestamp);
          });
      });
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
    cy.get('.euiTableRow').should('have.length.greaterThan', 0);
  });

  it('should display a message when no top queries are found', () => {
    clearAll();
    cy.wait(10000);
    cy.reload();
    cy.contains('No items found');
  });

  it('should paginate the query table', () => {
    for (let i = 0; i < 20; i++) {
      cy.searchOnIndex(indexName);
    }
    cy.wait(10000);
    cy.reload();
    cy.get('.euiPagination').should('be.visible');
    cy.get('.euiPagination__item').contains('2').click();
    // Verify rows on the second page
    cy.get('.euiTableRow').should('have.length.greaterThan', 0);
  });

  it('should get minimal details of the query using verbose=false', () => {
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    return cy
      .request({
        method: 'GET',
        url: `/api/top_queries/latency`,
        qs: {
          from: from,
          to: to,
          verbose: false,
        },
      })
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('ok', true);

        const responseData = response.body.response;
        expect(responseData).to.have.property('top_queries');
        expect(responseData.top_queries).to.be.an('array');
        expect(responseData.top_queries.length).to.be.greaterThan(0);

        const firstQuery = responseData.top_queries[0];
        const requiredFields = [
          'group_by',
          'id',
          'indices',
          'labels',
          'measurements',
          'node_id',
          'search_type',
          'timestamp',
          'total_shards',
        ];

        expect(firstQuery).to.include.all.keys(requiredFields);
        const typeValidations = {
          group_by: 'string',
          id: 'string',
          indices: 'array',
          labels: 'object',
          measurements: 'object',
          node_id: 'string',
          search_type: 'string',
          timestamp: 'number',
          total_shards: 'number',
        };
        Object.entries(typeValidations).forEach(([field, type]) => {
          expect(firstQuery[field]).to.be.a(type, `${field} should be a ${type}`);
        });
        expect(firstQuery.measurements).to.have.all.keys(['cpu', 'latency', 'memory']);
        ['cpu', 'latency', 'memory'].forEach((metric) => {
          expect(firstQuery.measurements[metric]).to.be.an('object');
        });
      });

    after(() => clearAll());
  });
});

describe('Query Insights Dashboard - Dynamic Columns change with Intercepted Top Queries', () => {
  beforeEach(() => {
    cy.fixture('plugins/query-insights-dashboards/stub_top_queries.json').then((stubResponse) => {
      cy.intercept('GET', '**/api/top_queries/*', {
        statusCode: 200,
        body: stubResponse,
      }).as('getTopQueries');
    });

    cy.waitForQueryInsightsPlugin();
    cy.wait(2000);
    cy.wait('@getTopQueries');
  });

  const testMetricSorting = (columnLabel, columnIndex) => {
    cy.get('.euiTableHeaderCell').contains(columnLabel).click();
    cy.wait(1000);

    cy.get('.euiTableRow').then(($rows) => {
      const values = [...$rows].map(($row) => {
        const rawText = Cypress.$($row).find('td').eq(columnIndex).text().trim();
        return parseFloat(rawText.replace(/[^\d.]/g, '')); // remove 'ms'/'B'
      });
      const sortedAsc = [...values].sort((a, b) => a - b);
      expect(values).to.deep.equal(sortedAsc);
    });

    cy.get('.euiTableHeaderCell').contains(columnLabel).click();
    cy.wait(1000);

    cy.get('.euiTableRow').then(($rows) => {
      const values = [...$rows].map(($row) => {
        const rawText = Cypress.$($row).find('td').eq(columnIndex).text().trim();
        return parseFloat(rawText.replace(/[^\d.]/g, ''));
      });
      const sortedDesc = [...values].sort((a, b) => b - a);
      expect(values).to.deep.equal(sortedDesc);
    });
  };

  it('should render only individual query-related headers when NONE filter is applied', () => {
    cy.wait(1000);
    cy.get('.euiFilterButton').contains('Type').click();
    cy.get('.euiFilterSelectItem').contains('query').click();
    cy.wait(1000);

    const expectedHeaders = [
      'Id',
      'Type',
      'Timestamp',
      'Latency',
      'CPU Time',
      'Memory Usage',
      'Indices',
      'Search Type',
      'Coordinator Node ID',
      'Total Shards',
    ];

    cy.get('.euiTableHeaderCell').should('have.length', expectedHeaders.length);

    cy.get('.euiTableHeaderCell').should(($headers) => {
      const actualHeaders = $headers.map((index, el) => Cypress.$(el).text().trim()).get();
      expect(actualHeaders).to.deep.equal(expectedHeaders);
    });
    testMetricSorting('Timestamp', 2);
    testMetricSorting('Latency', 3);
    testMetricSorting('CPU Time', 4);
    testMetricSorting('Memory Usage', 5);
  });

  it('should render only group-related headers in the correct order when SIMILARITY filter is applied', () => {
    cy.get('.euiFilterButton').contains('Type').click();
    cy.get('.euiFilterSelectItem').contains('group').click();
    cy.wait(1000);

    const expectedHeaders = [
      'Id',
      'Type',
      'Query Count',
      'Average Latency',
      'Average CPU Time',
      'Average Memory Usage',
    ];

    cy.get('.euiTableHeaderCell').should(($headers) => {
      const actualHeaders = $headers.map((index, el) => Cypress.$(el).text().trim()).get();
      expect(actualHeaders).to.deep.equal(expectedHeaders);
    });
    testMetricSorting('Query Count', 2);
    testMetricSorting('Average Latency', 3);
    testMetricSorting('Average CPU Time', 4);
    testMetricSorting('Average Memory Usage', 5);
  });
  it('should display both query and group data with proper headers when both are selected', () => {
    cy.get('.euiFilterButton').contains('Type').click();
    cy.get('.euiFilterSelectItem').contains('query').click();
    cy.get('.euiFilterSelectItem').contains('group').click();
    cy.wait(1000);

    const expectedGroupHeaders = [
      'Id',
      'Type',
      'Query Count',
      'Timestamp',
      'Avg Latency / Latency',
      'Avg CPU Time / CPU Time',
      'Avg Memory Usage / Memory Usage',
      'Indices',
      'Search Type',
      'Coordinator Node ID',
      'Total Shards',
    ];
    cy.get('.euiTableHeaderCell').should(($headers) => {
      const actualHeaders = $headers.map((index, el) => Cypress.$(el).text().trim()).get();
      expect(actualHeaders).to.deep.equal(expectedGroupHeaders);
    });
    testMetricSorting('Query Count', 2);
    testMetricSorting('Timestamp', 3);
    testMetricSorting('Avg Latency / Latency', 4);
    testMetricSorting('Avg CPU Time / CPU Time', 5);
    testMetricSorting('Avg Memory Usage / Memory Usage', 6);
  });
});
