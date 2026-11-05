/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import sampleDocument from '../../../fixtures/plugins/query-insights-dashboards/sample_document.json';
import {
  QUERY_INSIGHTS_METRICS as METRICS,
  QUERY_INSIGHTS_OVERVIEW_PATH,
} from '../../../utils/plugins/query-insights-dashboards/constants';

const indexName = 'sample_index';

const clearAll = () => {
  cy.deleteIndexByName(indexName);
  cy.disableTopQueries(METRICS.LATENCY);
  cy.disableTopQueries(METRICS.CPU);
  cy.disableTopQueries(METRICS.MEMORY);
};

describe('Top Queries Details Page', () => {
  beforeEach(() => {
    clearAll();
    cy.createIndexByName(indexName, sampleDocument);
    cy.enableTopQueries(METRICS.LATENCY);
    cy.enableTopQueries(METRICS.CPU);
    cy.enableTopQueries(METRICS.MEMORY);
    cy.searchOnIndex(indexName);
    cy.searchOnIndex(indexName);
    cy.searchOnIndex(indexName);
    // Poll the OpenSearch _insights/top_queries API until data is available, then
    // navigate directly to /query-details by query id. Upstream clicks the first
    // row of `.euiBasicTable:last` in the overview, but with the new
    // Stats & Visualizations panel that selector occasionally lands on a chart
    // table row and routes to a query-details URL with a short bucket id, which
    // shows "No Data Available" and breaks every assertion in this describe.
    cy.waitForTopQueriesData();
    cy.navigateToQueryDetails();
  });

  it('should display correct details on the query details page', () => {
    cy.url().should('include', '/query-details');
    // Validate the page title
    cy.get('h1').contains('Query details').should('be.visible');
    // Validate the summary section
    cy.get('[data-test-subj="query-details-summary-section"]').should(
      'be.visible'
    );
    // Validate the task resource usage section
    cy.get('[data-test-subj="query-details-task-resource-usages"]').should(
      'be.visible'
    );
    // Validate the presence of latency chart
    cy.get('[data-test-subj="query-details-latency-chart"]').should(
      'be.visible'
    );
    // Validate the presence of query source details section
    cy.get('[data-test-subj="query-details-source-section"]').should(
      'be.visible'
    );
  });

  /**
   * Validate summary panel has valid labels
   */
  it('the summary panel should display correctly', () => {
    // Validate all field labels exist
    const fieldLabels = [
      'Timestamp',
      'Latency',
      'CPU Time',
      'Memory Usage',
      'Indices',
      'Search Type',
      'Coordinator Node ID',
      'Total Shards',
      'Status',
    ];
    fieldLabels.forEach((label) => {
      cy.get('.euiPanel').contains('h4', label).should('be.visible');
    });
  });

  /**
   * Validate each field in the summary panel has valid content
   */
  it('should display correct values for all fields in the summary panel', () => {
    cy.get('[data-test-subj="query-details-summary-section"]').within(() => {
      // Validate Timestamp
      cy.contains('h4', 'Timestamp')
        .parent()
        .next()
        .invoke('text')
        .should('match', /\w{3} \d{2}, \d{4} @ \d{1,2}:\d{2}:\d{2} [AP]M/);
      // Validate Latency
      cy.contains('h4', 'Latency')
        .parent()
        .next()
        .invoke('text')
        .should('match', /^\d+(\.\d{1,2})? ms$/);
      // Validate CPU Time
      cy.contains('h4', 'CPU Time')
        .parent()
        .next()
        .invoke('text')
        .should('match', /^\d+(\.\d+)? ms$/);
      // Validate Memory Usage
      cy.contains('h4', 'Memory Usage')
        .parent()
        .next()
        .invoke('text')
        .should('match', /^\d+(\.\d+)? B$/);
      // Validate Indices
      cy.contains('h4', 'Indices')
        .parent()
        .next()
        .invoke('text')
        .should('not.be.empty');
      // Validate Search Type
      cy.contains('h4', 'Search Type')
        .parent()
        .next()
        .invoke('text')
        .should('equal', 'query then fetch');
      // Validate Coordinator Node ID
      cy.contains('h4', 'Coordinator Node ID')
        .parent()
        .next()
        .invoke('text')
        .should('not.be.empty');
      // Validate Total Shards
      cy.contains('h4', 'Total Shards')
        .parent()
        .next()
        .invoke('text')
        .then((text) => {
          const shardCount = parseInt(text.trim(), 10);
          expect(shardCount).to.be.a('number').and.to.be.greaterThan(0);
        });
    });
  });

  /**
   * Validate Task Resource Usage panel renders when verbose=true
   */
  it('should display the Task Resource Usage panel with coordinator and shard tasks', () => {
    cy.get('[data-test-subj="query-details-task-resource-usages"]').should(
      'be.visible'
    );
    cy.get('[data-test-subj="query-details-task-resource-usages"]').within(
      () => {
        cy.contains('h2', 'Task Resource Usage').should('be.visible');
        cy.contains('h3', 'Coordinator Task').should('be.visible');
        cy.contains('h3', 'Shard Tasks').should('be.visible');
        // Coordinator task fields
        cy.contains('Task ID').should('be.visible');
        cy.contains('Node ID').should('be.visible');
        cy.contains('CPU Time (ms)').should('be.visible');
        cy.contains('Memory (bytes)').should('be.visible');
        // Shard tasks table
        cy.get('.euiBasicTable').should('be.visible');
        cy.get('.euiTableHeaderCell').contains('Phase').should('be.visible');
        cy.get('.euiTableRow').should('have.length.greaterThan', 0);
      }
    );
  });

  /**
   * Validate the latency chart interaction
   */
  it('should render the latency chart and allow interaction', () => {
    // Ensure the chart container is visible
    cy.get('[data-test-subj="query-details-latency-chart"]').should(
      'be.visible'
    );
    // Validate ECharts canvas is rendered
    cy.get('[data-test-subj="query-details-latency-chart"] svg').should(
      'be.visible'
    );
  });

  it('should get complete details of the query using verbose=true for query type', () => {
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
          'search_type',
          'source',
          'task_resource_usages',
          'timestamp',
          'total_shards',
        ]);

        expect(firstQuery.group_by).to.equal('NONE');
        expect(firstQuery.indices).to.be.an('array');
        expect(firstQuery.measurements).to.have.all.keys([
          'cpu',
          'latency',
          'memory',
        ]);
      });
  });

  after(() => clearAll());
});

// User info fields (Username / User Roles / Backend Roles) in the details summary panel are
// version-gated at >= 3.5. This block stubs /api/cluster/version and /api/top_queries so the
// panel renders deterministically regardless of the live cluster's security configuration.
describe('Top Queries Details Page — User Info Summary', () => {
  const queryWithUserInfo = {
    id: 'user-info-query-1',
    timestamp: Date.now() - 5000,
    measurements: {
      latency: { number: 5000000, count: 1 },
      cpu: { number: 3000000, count: 1 },
      memory: { number: 4096, count: 1 },
    },
    indices: ['analytics-data'],
    search_type: 'query_then_fetch',
    node_id: 'node1',
    total_shards: 2,
    group_by: 'NONE',
    source: { query: { match_all: {} } },
    phase_latency_map: {},
    task_resource_usages: [],
    labels: { 'X-Opaque-Id': 'analytics-app' },
    username: 'alice',
    user_roles: ['analyst', 'readall'],
    backend_roles: ['analytics-backend', 'ops'],
  };

  const topQueriesBody = {
    ok: true,
    response: { top_queries: [queryWithUserInfo] },
  };

  beforeEach(() => {
    cy.intercept('GET', '**/api/cluster/version', {
      statusCode: 200,
      body: { version: '3.8.0' },
    }).as('clusterVersion');
    cy.intercept('GET', '**/api/top_queries/**', {
      statusCode: 200,
      body: topQueriesBody,
    }).as('topQueries');

    // Navigate directly to /query-details by the stubbed query id instead of clicking the
    // first row of `.euiBasicTable:last` in the overview (same reason as
    // navigateToQueryDetails: that selector can land on a Stats & Visualizations chart row).
    // The stubbed query is not in the real cluster, so navigateToQueryDetails itself can't
    // be used here. Force reload because testIsolation is disabled in this repo's
    // cypress.config — the cluster version is cached per page load, and a hash-only
    // cy.visit() would otherwise keep the previous page's state.
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const basePath = QUERY_INSIGHTS_OVERVIEW_PATH.split('#')[0];
    cy.visit(
      `${basePath}#/query-details?from=${encodeURIComponent(
        from
      )}&to=${encodeURIComponent(to)}&id=${encodeURIComponent(
        queryWithUserInfo.id
      )}&verbose=true`
    );
    cy.reload();
    cy.wait('@topQueries', { timeout: 60000 });
    cy.url().should('include', '/query-details');
  });

  it('shows Username, User Roles, and Backend Roles labels in the summary panel', () => {
    cy.get('[data-test-subj="query-details-summary-section"]').within(() => {
      cy.contains('h4', 'Username').should('be.visible');
      cy.contains('h4', 'User Roles').should('be.visible');
      cy.contains('h4', 'Backend Roles').should('be.visible');
    });
  });

  it('displays the correct user info values in the summary panel', () => {
    cy.get('[data-test-subj="query-details-summary-section"]').within(() => {
      cy.contains('h4', 'Username')
        .parent()
        .next()
        .invoke('text')
        .should('equal', 'alice');
      cy.contains('h4', 'User Roles')
        .parent()
        .next()
        .invoke('text')
        .should('equal', 'analyst, readall');
      cy.contains('h4', 'Backend Roles')
        .parent()
        .next()
        .invoke('text')
        .should('equal', 'analytics-backend, ops');
    });
  });

  // Regression guard: the details panel reads the X-Opaque-Id from the X-Opaque-Id
  // label, matching the Top N table behavior.
  it('shows X-Opaque-Id from the label', () => {
    cy.get('[data-test-subj="query-details-summary-section"]').within(() => {
      cy.contains('h4', 'X-Opaque-Id').should('be.visible');
      cy.contains('h4', 'X-Opaque-Id')
        .parent()
        .next()
        .invoke('text')
        .should('equal', 'analytics-app');
    });
  });
});
