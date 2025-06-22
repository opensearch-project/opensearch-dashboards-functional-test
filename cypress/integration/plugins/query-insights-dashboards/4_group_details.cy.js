/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import sampleDocument from '../../../fixtures/plugins/query-insights-dashboards/sample_document.json';


const indexName = 'sample_index';

const clearAll = () => {
  cy.deleteIndexByName(indexName);
  cy.disableGrouping();
};

describe('Query Group Details Page', () => {
  beforeEach(() => {
    clearAll();
    cy.wait(5000);
    cy.createIndexByName(indexName, sampleDocument);
    cy.enableGrouping();
    // waiting for the query insights to stablize
    cy.wait(5000);
    cy.searchOnIndex(indexName);
    cy.searchOnIndex(indexName);
    cy.searchOnIndex(indexName);
    // waiting for the query insights queue to drain
    cy.wait(10000);
    cy.navigateToOverview();
    cy.get('.euiTableRow').first().find('button').first().trigger('mouseover');
    cy.wait(1000);
    // Click the first button in the 'group' row
    cy.get('.euiTableRow').first().find('button').first().click(); // Navigate to details
    cy.wait(1000);
  });

  it('should display correct details on the group details page', () => {
    cy.url().should('include', '/query-group-details');
    // Validate the page title
    cy.get('h1').contains('Query group details').should('be.visible');

    // Validate tooltip for query group details
    cy.get('[aria-label="Details tooltip"]').eq(0).should('be.visible');

    // Validate the Sample Query Details section
    cy.get('h1').contains('Sample query details').should('be.visible');

    // Validate tooltip for sample query details
    cy.get('[aria-label="Details tooltip"]').eq(1).should('be.visible');

    // Validate the presence of query source section
    cy.get('.euiPanel').contains('Query').should('be.visible');

    // Validate the presence of the latency chart
    cy.get('#latency').should('be.visible');
  });

  it('should validate the aggregate summary fields', () => {
    const expectedLabels = [
      'Id',
      'Average Latency',
      'Average CPU Time',
      'Average Memory Usage',
      'Group by',
    ];

    // Validate all field labels exist in the first EuiPanel
    cy.get('.euiPanel')
      .first()
      .within(() => {
        expectedLabels.forEach((label) => {
          cy.contains('h4', label).should('be.visible');
        });
      });
  });

  it('should validate the sample query summary panel fields', () => {
    const expectedLabels = [
      'Timestamp',
      'Indices',
      'Search Type',
      'Coordinator Node ID',
      'Total Shards',
    ];

    // Validate all field labels exist in the second EuiPanel
    cy.get('.euiPanel')
      .eq(1)
      .within(() => {
        expectedLabels.forEach((label) => {
          cy.contains('h4', label).should('be.visible');
        });
      });
  });

  it('should display the query source code block', () => {
    // Validate the query source code block
    cy.get('.euiCodeBlock').should('be.visible');
  });

  it('should display the latency panel correctly', () => {
    // Validate the fourth EuiPanel contains the Latency section
    cy.get('.euiPanel')
      .eq(3)
      .within(() => {
        cy.contains('h2', 'Latency').should('be.visible');
        cy.get('#latency').should('be.visible');
      });
  });
  it('should get complete details of the query using verbose=true for group type', () => {
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    return cy
      .request({
        method: 'GET',
        url: `/api/top_queries/latency`,
        qs: {
          from: from,
          to: to,
          verbose: true,
        },
      })
      .then((response) => {
        // Verify response status and structure
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('ok', true);

        cy.log('Response structure:', JSON.stringify(response.body, null, 2));

        const responseData = response.body.response;
        expect(responseData).to.have.property('top_queries');
        expect(responseData.top_queries).to.be.an('array');
        expect(responseData.top_queries.length).to.be.greaterThan(0);

        const firstQuery = responseData.top_queries[0];
        expect(firstQuery).to.include.all.keys([
          'group_by',
          'id',
          'indices',
          'labels',
          'measurements',
          'node_id',
          'phase_latency_map',
          'query_group_hashcode',
          'search_type',
          'source',
          'task_resource_usages',
          'timestamp',
          'total_shards',
        ]);
        expect(firstQuery.group_by).to.equal('SIMILARITY');
        expect(firstQuery.indices).to.be.an('array');
        expect(firstQuery.id).to.be.a('string');
        expect(firstQuery.labels).to.be.an('object');
        expect(firstQuery.node_id).to.be.a('string');
        expect(firstQuery.query_group_hashcode).to.be.a('string');
        expect(firstQuery.search_type).to.be.a('string');
        expect(firstQuery.timestamp).to.be.a('number');
        expect(firstQuery.total_shards).to.be.a('number');
        expect(firstQuery.measurements.cpu).to.be.an('object');
        expect(firstQuery.measurements.latency).to.be.an('object');
        expect(firstQuery.measurements.memory).to.be.an('object');
      });
  });

  after(() => clearAll());
});
