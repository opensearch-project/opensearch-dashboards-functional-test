/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import MIXED from '../../../fixtures/stub_top_queries.json';
import QUERY_ONLY from '../../../fixtures/stub_top_queries_query_only.json';
import GROUP_ONLY from '../../../fixtures/stub_top_queries_group_only.json';
import {
  makeTimestampedBody,
  getRowsFromRaw,
  assertRowCountEquals,
  getHeaders,
  expectSortedBy,
  setTypeFilter,
  resetTypeFilterToNone,
} from '../../../utils/plugins/query-insights-dashboards/helpers';

describe('Query Insights — Dynamic Columns', () => {
  describe('With Intercepted Top Queries (MIXED)', () => {
    var mixedRows;
    var totalRowCount;

    before(() => {
      mixedRows = getRowsFromRaw(MIXED);
      totalRowCount = mixedRows.length;
    });

    beforeEach(() => {
      cy.intercept('GET', '**/api/top_queries/**', (req) => {
        req.reply({ statusCode: 200, body: makeTimestampedBody(MIXED) });
      }).as('topQueries');

      cy.waitForQueryInsightsPlugin();
      cy.wait('@topQueries');
    });

    it('renders combined headers when Nothing is selected in type', () => {
      resetTypeFilterToNone();
      const expected = [
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
        'WLM Group',
        'Total Shards',
      ];
      getHeaders().should('deep.equal', expected);
      assertRowCountEquals(totalRowCount);
      expectSortedBy('Query Count', 2);
      expectSortedBy('Avg Latency / Latency', 4);
      expectSortedBy('Avg CPU Time / CPU Time', 5);
      expectSortedBy('Avg Memory Usage / Memory Usage', 6);
    });

    it('renders query-only headers when Type=query', () => {
      setTypeFilter('query');
      const expected = [
        'Id',
        'Type',
        'Timestamp',
        'Latency',
        'CPU Time',
        'Memory Usage',
        'Indices',
        'Search Type',
        'Coordinator Node ID',
        'WLM Group',
        'Total Shards',
      ];
      getHeaders().should('deep.equal', expected);

      const queryOnlyCount = mixedRows.filter(
        (r) => String(r.group_by).toUpperCase() === 'NONE'
      ).length;
      assertRowCountEquals(queryOnlyCount);

      expectSortedBy('Timestamp', 2);
      expectSortedBy('Latency', 3);
      expectSortedBy('CPU Time', 4);
      expectSortedBy('Memory Usage', 5);
    });

    it('renders group-only headers when Type=group', () => {
      setTypeFilter('group');
      const expected = [
        'Id',
        'Type',
        'Query Count',
        'Average Latency',
        'Average CPU Time',
        'Average Memory Usage',
      ];
      getHeaders().should('deep.equal', expected);

      const groupOnlyCount = mixedRows.filter(
        (r) => String(r.group_by).toUpperCase() !== 'NONE'
      ).length;
      assertRowCountEquals(groupOnlyCount);

      expectSortedBy('Query Count', 2);
      expectSortedBy('Average Latency', 3);
      expectSortedBy('Average CPU Time', 4);
      expectSortedBy('Average Memory Usage', 5);
    });

    it('renders combined headers when Type=both', () => {
      setTypeFilter('both');
      const expected = [
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
        'WLM Group',
        'Total Shards',
      ];
      getHeaders().should('deep.equal', expected);
      assertRowCountEquals(totalRowCount);

      expectSortedBy('Query Count', 2);
      expectSortedBy('Avg Latency / Latency', 4);
      expectSortedBy('Avg CPU Time / CPU Time', 5);
      expectSortedBy('Avg Memory Usage / Memory Usage', 6);
    });
  });

  // ---- QUERY ONLY fixture (no Type toggle)
  describe('QUERY ONLY fixture', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/top_queries/**', (req) => {
        req.reply({ statusCode: 200, body: makeTimestampedBody(QUERY_ONLY) });
      }).as('topQueries');

      cy.waitForQueryInsightsPlugin();
      cy.wait('@topQueries');
    });

    it('renders only query headers (without changing Type filter)', () => {
      const expected = [
        'Id',
        'Type',
        'Timestamp',
        'Latency',
        'CPU Time',
        'Memory Usage',
        'Indices',
        'Search Type',
        'Coordinator Node ID',
        'WLM Group',
        'Total Shards',
      ];
      getHeaders().should('deep.equal', expected);
      assertRowCountEquals(getRowsFromRaw(QUERY_ONLY).length);
    });
  });

  // ---- GROUP ONLY fixture (no Type toggle)
  describe('GROUP ONLY fixture', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/top_queries/**', (req) => {
        req.reply({ statusCode: 200, body: makeTimestampedBody(GROUP_ONLY) });
      }).as('topQueries');

      cy.waitForQueryInsightsPlugin();
      cy.wait('@topQueries');
    });

    it('renders only group headers (without changing Type filter)', () => {
      const expected = [
        'Id',
        'Type',
        'Query Count',
        'Average Latency',
        'Average CPU Time',
        'Average Memory Usage',
      ];
      getHeaders().should('deep.equal', expected);
      assertRowCountEquals(getRowsFromRaw(GROUP_ONLY).length);
    });
  });
});
