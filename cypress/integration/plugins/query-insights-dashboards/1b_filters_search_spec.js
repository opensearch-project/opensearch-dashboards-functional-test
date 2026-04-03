/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import MIXED from '../../../fixtures/stub_top_queries.json';
import {
  makeTimestampedBody,
  deriveExpectations,
  assertRowCountEquals,
  setTypeFilter,
  resetTypeFilterToNone,
  setNodeIdFilter,
  setSearchTypeFilter,
  setIndicesFilter,
} from '../../../utils/plugins/query-insights-dashboards/helpers';

describe('Query Insights — Filters and Search', () => {
  let expected;
  let expectingAll;
  let primaryNodeId;
  let secondaryNodeId;
  let primaryIndexName;
  let secondaryIndexName;
  let defaultSearchType;

  before(() => {
    // derive expectations from query-only payload
    expected = deriveExpectations(MIXED, 'query');
    expectingAll = deriveExpectations(MIXED);
    [primaryNodeId, secondaryNodeId] = expected.nodeIds;
    [primaryIndexName, secondaryIndexName] = expected.indexNames;
    [defaultSearchType] = expected.searchTypes;
  });

  beforeEach(() => {
    // intercept with ONLY query rows, plus fresh timestamps
    cy.intercept('GET', '**/api/top_queries/**', (req) => {
      req.reply({ statusCode: 200, body: makeTimestampedBody(MIXED) });
    }).as('topQueries');

    cy.waitForQueryInsightsPlugin();
    cy.wait('@topQueries');
  });

  it('filters by Node ID', () => {
    if (primaryNodeId) {
      setNodeIdFilter([primaryNodeId]);
      assertRowCountEquals(expected.nodeIdCounts[primaryNodeId]);
      cy.get('.euiBasicTable')
        .last()
        .find('.euiTableRow')
        .each(($r) => cy.wrap($r).contains('td', primaryNodeId));
    }
    setNodeIdFilter([primaryNodeId]); // clear

    if (secondaryNodeId) {
      setNodeIdFilter([secondaryNodeId]);
      assertRowCountEquals(expected.nodeIdCounts[secondaryNodeId]);
      cy.get('.euiBasicTable')
        .last()
        .find('.euiTableRow')
        .each(($r) => cy.wrap($r).contains('td', secondaryNodeId));
    }
    setNodeIdFilter([secondaryNodeId]); // clear
    assertRowCountEquals(expectingAll.totalRowCount);
  });

  it('filters by Search Type', () => {
    if (defaultSearchType) {
      setSearchTypeFilter([defaultSearchType]);
      assertRowCountEquals(expected.searchTypeCounts[defaultSearchType]);
      cy.get('.euiBasicTable')
        .last()
        .find('.euiTableRow')
        .each(($r) => cy.wrap($r).contains('td', 'query then fetch'));
    }
    setSearchTypeFilter([defaultSearchType]);

    assertRowCountEquals(expectingAll.totalRowCount);
  });

  it('filters by Indices', () => {
    if (primaryIndexName) {
      setIndicesFilter([primaryIndexName]);
      assertRowCountEquals(expected.indexCounts[primaryIndexName]);
      cy.get('.euiBasicTable')
        .last()
        .find('.euiTableRow')
        .each(($r) => cy.wrap($r).contains('td', primaryIndexName));
    }
    setIndicesFilter([primaryIndexName]);

    if (secondaryIndexName) {
      setIndicesFilter([secondaryIndexName]);
      assertRowCountEquals(expected.indexCounts[secondaryIndexName]);
      cy.get('.euiBasicTable')
        .last()
        .find('.euiTableRow')
        .each(($r) => cy.wrap($r).contains('td', secondaryIndexName));
    }
    setIndicesFilter([secondaryIndexName]);

    const both = [primaryIndexName, secondaryIndexName].filter(Boolean);
    if (both.length > 1) {
      setIndicesFilter(both);
      assertRowCountEquals(expected.totalRowCount);
    }

    setIndicesFilter([]); // clear
    assertRowCountEquals(expected.totalRowCount);
  });

  it('updates search box when filter is selected', () => {
    resetTypeFilterToNone();
    cy.get('.euiFieldSearch').should('have.value', '');
    setTypeFilter('query');
    cy.get('.euiFieldSearch').should('contain.value', 'group_by');
  });

  it('clears search box when filters are cleared', () => {
    setTypeFilter('query');
    cy.get('.euiFieldSearch').should('not.have.value', '');
    resetTypeFilterToNone();
    cy.get('.euiFieldSearch').clear();
    cy.get('.euiFieldSearch').should('have.value', '');
  });

  it('filters by query ID in free-text search', () => {
    // a2e1c822 matches 2 queries in fixture
    cy.get('.euiFieldSearch').clear().type('a2e1c822');
    cy.get('.euiBasicTable').last().find('.euiTableRow').should('have.length', 2);
  });

  it('filters by index name in free-text search', () => {
    // my-index only appears in one query (group_by: NONE)
    cy.get('.euiFieldSearch').clear().type('my-index');
    cy.get('.euiBasicTable').last().find('.euiTableRow').should('have.length', 1);
    cy.get('.euiBasicTable').last().find('.euiTableRow').should('contain', 'my-index');
  });

  it('filters by node ID in free-text search', () => {
    // UYKFun8 appears in 2 queries (1 NONE, 1 SIMILARITY) - free-text filters to NONE only
    cy.get('.euiFieldSearch').clear().type('UYKFun8');
    cy.get('.euiBasicTable').last().find('.euiTableRow').should('have.length', 2);
  });

  it('shows no results for non-matching free-text search', () => {
    cy.get('.euiFieldSearch').clear().type('nonexistent_xyz_123');
    cy.get('.euiBasicTable').last().contains('No items found').should('be.visible');
  });

  it('combines free-text search with filter selection', () => {
    setTypeFilter('query');
    // .kibana appears in all queries
    cy.get('.euiFieldSearch').type(' kibana');
    cy.get('.euiBasicTable').last().find('.euiTableRow').should('have.length.greaterThan', 0);
    cy.get('.euiFieldSearch').should('contain.value', 'group_by');
    cy.get('.euiFieldSearch').should('contain.value', 'kibana');
  });
});
