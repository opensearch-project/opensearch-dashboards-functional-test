/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import sampleDocument from '../../../fixtures/plugins/query-insights-dashboards/sample_document.json';
import { QUERY_INSIGHTS_METRICS as METRICS } from '../../../utils/plugins/query-insights-dashboards/constants';

import MIXED from '../../../fixtures/stub_top_queries.json';
import QUERY_ONLY from '../../../fixtures/stub_top_queries_query_only.json';
import GROUP_ONLY from '../../../fixtures/stub_top_queries_group_only.json';

const makeTimestampedBody = (raw) => {
  const body = JSON.parse(JSON.stringify(raw));
  const list = body?.response?.top_queries ?? body?.top_queries ?? [];
  const now = Date.now();
  body.response = body.response || {};
  body.response.top_queries = list.map((q, i) => ({
    ...q,
    timestamp: now - i * 1000,
  }));
  return body;
};

const getRowsFromRaw = (raw) =>
  (raw?.response?.top_queries ?? raw?.top_queries ?? []).slice();

const assertRowCountEquals = (expected) => {
  // Target the main data table (last table on page), not the chart table
  cy.get('.euiBasicTable')
    .last()
    .find('.euiTableRow')
    .should('have.length', expected);
};

const getHeaders = () =>
  // Target the main data table headers (last table on page), not the chart table
  cy
    .get('.euiBasicTable')
    .last()
    .find('.euiTableHeaderCell')
    .then(($h) =>
      $h
        .map((_, el) => Cypress.$(el).text().trim())
        .get()
        .filter(Boolean)
    );

const expectSortedBy = (label) => {
  const extract = ($rows, colIdx) =>
    [...$rows].map(($r) => {
      const txt = Cypress.$($r).find('td').eq(colIdx).text().trim();
      if (/ms|s|B|KB|MB|GB|TB/i.test(txt))
        return parseFloat(txt.replace(/[^\d.]/g, '')) || 0;
      const ms = Date.parse(txt);
      if (!Number.isNaN(ms)) return ms;
      const num = parseFloat(txt.replace(/[^\d.-]/g, ''));
      return Number.isNaN(num) ? 0 : num;
    });

  // Target the main data table (last table on page)
  cy.get('.euiBasicTable')
    .last()
    .find('.euiTableHeaderCell')
    .contains(label)
    .click();
  cy.get('.euiBasicTable')
    .last()
    .find('.euiTableRow')
    .then(($r) => {
      const v = extract($r);
      const asc = [...v].sort((a, b) => a - b);
      expect(v, `${label} asc`).to.deep.equal(asc);
    });

  cy.get('.euiBasicTable')
    .last()
    .find('.euiTableHeaderCell')
    .contains(label)
    .click();
  cy.get('.euiBasicTable')
    .last()
    .find('.euiTableRow')
    .then(($r) => {
      const v = extract($r);
      const desc = [...v].sort((a, b) => b - a);
      expect(v, `${label} desc`).to.deep.equal(desc);
    });
};

const setTypeFilter = (mode /* 'query' | 'group' | 'both' */) => {
  const searchInput = `input[placeholder="e.g. latency >= 100 AND type = query"]`;
  cy.get(searchInput).clear({ force: true });
  if (mode === 'query') {
    cy.get(searchInput).type('type = query', { force: true });
  } else if (mode === 'group') {
    cy.get(searchInput).type('type = group', { force: true });
  }
  cy.wait(300);
};

const resetTypeFilterToNone = () => {
  const searchInput = `input[placeholder="e.g. latency >= 100 AND type = query"]`;
  cy.get(searchInput).clear({ force: true });
  cy.wait(300);
};
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

    // Verify the main data table is visible and has content
    cy.get('.euiBasicTable').last().should('be.visible');
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableHeaderCell')
      .should('have.length.greaterThan', 0);

    // Verify there are query rows in the main table
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableRow')
      .should('have.length.greaterThan', 0);
  });

  /**
   * Validate sorting by the "Timestamp" column works correctly
   */
  it('should sort the table by the Timestamp column', () => {
    // waiting for the query insights queue to drain
    cy.wait(10000);
    cy.navigateToOverview();
    // Ensure main table has data before attempting to sort
    cy.get('.euiBasicTable', { timeout: 30000 })
      .last()
      .find('.euiTableRow')
      .should('have.length.greaterThan', 0);
    cy.get('body').should('not.contain', 'No items found');
    // Click the Timestamp column header in main table to sort
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableHeaderCell')
      .contains('Timestamp')
      .click();
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableRow')
      .first()
      .invoke('text')
      .then((firstRowAfterSort) => {
        const firstTimestamp = firstRowAfterSort.trim();
        cy.get('.euiBasicTable')
          .last()
          .find('.euiTableHeaderCell')
          .contains('Timestamp')
          .click();
        cy.get('.euiBasicTable')
          .last()
          .find('.euiTableRow')
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

  it('should display a message when no top queries are found', () => {
    clearAll();
    cy.wait(10000);
    cy.reload();
    cy.contains('No items found').should('be.visible');
  });

  it('should paginate the query table', () => {
    for (let i = 0; i < 20; i++) {
      cy.searchOnIndex(indexName);
    }
    cy.wait(10000);
    cy.reload();
    // Pagination is on the main table
    cy.get('.euiPagination').should('be.visible');
    cy.get('.euiPagination__item').contains('2').click();
    // Verify rows on the second page in main table
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableRow')
      .should('have.length.greaterThan', 0);
  });

  after(() => clearAll());
});

describe('Query Insights — Dynamic Columns with Intercepted Top Queries (MIXED)', () => {
  const mixedRows = getRowsFromRaw(MIXED);
  const totalRowCount = mixedRows.length;

  beforeEach(() => {
    cy.intercept('GET', '**/api/top_queries/**', (req) => {
      req.reply({ statusCode: 200, body: makeTimestampedBody(MIXED) });
    }).as('topQueries');

    cy.waitForQueryInsightsPlugin();
    // Force reload because testIsolation is disabled in this repo's cypress.config —
    // without it, cy.visit() to the same URL is a no-op and the intercepted request never fires.
    cy.reload();
    cy.wait('@topQueries', { timeout: 60000 });
  });

  it('renders combined headers when Nothing is selected in type', () => {
    resetTypeFilterToNone();
    const expected = [
      'Id',
      'Type',
      'Query Count',
      'Timestamp',
      'Status',
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
    expectSortedBy('Query Count');
    expectSortedBy('Avg Latency / Latency');
    expectSortedBy('Avg CPU Time / CPU Time');
    expectSortedBy('Avg Memory Usage / Memory Usage');
  });

  it('renders query-only headers when Type=query', () => {
    setTypeFilter('query');
    const expected = [
      'Id',
      'Type',
      'Timestamp',
      'Status',
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

    expectSortedBy('Timestamp');
    expectSortedBy('Latency');
    expectSortedBy('CPU Time');
    expectSortedBy('Memory Usage');
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

    expectSortedBy('Query Count');
    expectSortedBy('Average Latency');
    expectSortedBy('Average CPU Time');
    expectSortedBy('Average Memory Usage');
  });

  it('renders combined headers when Type=both', () => {
    setTypeFilter('both');
    const expected = [
      'Id',
      'Type',
      'Query Count',
      'Timestamp',
      'Status',
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

    expectSortedBy('Query Count');
    expectSortedBy('Avg Latency / Latency');
    expectSortedBy('Avg CPU Time / CPU Time');
    expectSortedBy('Avg Memory Usage / Memory Usage');
  });
});

// ---- QUERY ONLY fixture (no Type toggle)
describe('Query Insights — Dynamic Columns (QUERY ONLY fixture)', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/top_queries/**', (req) => {
      req.reply({ statusCode: 200, body: makeTimestampedBody(QUERY_ONLY) });
    }).as('topQueries');

    cy.waitForQueryInsightsPlugin();
    // Force reload because testIsolation is disabled in this repo's cypress.config —
    // without it, cy.visit() to the same URL is a no-op and the intercepted request never fires.
    cy.reload();
    cy.wait('@topQueries', { timeout: 60000 });
  });

  it('renders only query headers (without changing Type filter)', () => {
    const expected = [
      'Id',
      'Type',
      'Timestamp',
      'Status',
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
describe('Query Insights — Dynamic Columns (GROUP ONLY fixture)', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/top_queries/**', (req) => {
      req.reply({ statusCode: 200, body: makeTimestampedBody(GROUP_ONLY) });
    }).as('topQueries');

    cy.waitForQueryInsightsPlugin();
    // Force reload because testIsolation is disabled in this repo's cypress.config —
    // without it, cy.visit() to the same URL is a no-op and the intercepted request never fires.
    cy.reload();
    cy.wait('@topQueries', { timeout: 60000 });
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

  it('renders dash in status column for group rows', () => {
    cy.get('.euiTableRow').each(($row) => {
      cy.wrap($row).find('.euiBadge').should('not.exist');
    });
  });
});

describe('Query Insights — Stats & Visualizations Panel', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/top_queries/**', (req) => {
      req.reply({ statusCode: 200, body: makeTimestampedBody(MIXED) });
    }).as('topQueries');

    cy.waitForQueryInsightsPlugin();
    // Force reload because testIsolation is disabled in this repo's cypress.config —
    // without it, cy.visit() to the same URL is a no-op and the intercepted request never fires.
    cy.reload();
    cy.wait('@topQueries', { timeout: 60000 });
  });

  it('displays visualizations panel with Query/Group toggle', () => {
    cy.get('[data-test-subj="visualizationModeToggle"]')
      .contains('Query')
      .should('be.visible');
    cy.get('[data-test-subj="visualizationModeToggle"]')
      .contains('Group')
      .should('be.visible');
  });

  it('hides content and Query/Group toggle when collapsed, restores when expanded', () => {
    // Verify content is visible initially
    cy.contains('P90 LATENCY').should('be.visible');
    cy.contains('Queries by Node').should('be.visible');
    cy.contains('Performance Analysis').should('be.visible');
    // Query/Group toggle should be visible
    cy.get('[data-test-subj="visualizationModeToggle"]').should('be.visible');

    // Collapse accordion by clicking the Visualizations heading
    cy.contains('h3', 'Stats & Visualizations').click();

    // Content should be hidden
    cy.contains('P90 LATENCY').should('not.be.visible');
    cy.contains('Queries by Node').should('not.be.visible');
    cy.contains('Performance Analysis').should('not.be.visible');
    // Query/Group toggle should not exist when collapsed (rendered as null)
    cy.get('[data-test-subj="visualizationModeToggle"]').should('not.exist');

    // Expand accordion
    cy.contains('h3', 'Stats & Visualizations').click();

    // Content and toggle should be restored
    cy.contains('P90 LATENCY').should('be.visible');
    cy.contains('Queries by Node').should('be.visible');
    cy.contains('Performance Analysis').should('be.visible');
    cy.get('[data-test-subj="visualizationModeToggle"]').should('be.visible');
  });

  it('displays percentile metrics in Query mode', () => {
    cy.contains('P90 LATENCY').should('be.visible');
    cy.contains('P90 CPU TIME').should('be.visible');
    cy.contains('P90 MEMORY').should('be.visible');
    cy.contains('P99 LATENCY').should('be.visible');
    cy.contains('P99 CPU TIME').should('be.visible');
    cy.contains('P99 MEMORY').should('be.visible');
  });

  it('shows empty state when Group mode is selected', () => {
    cy.get('[data-test-subj="visualizationModeToggle"]')
      .contains('Group')
      .click();
    cy.contains('No Visualization Available').should('be.visible');
    cy.contains('Visualizations for grouped queries are coming soon').should(
      'be.visible'
    );
  });

  it('switches back to Query mode and shows visualizations', () => {
    cy.get('[data-test-subj="visualizationModeToggle"]')
      .contains('Group')
      .click();
    cy.contains('No Visualization Available').should('be.visible');
    cy.get('[data-test-subj="visualizationModeToggle"]')
      .contains('Query')
      .click();
    cy.contains('P90 LATENCY').should('be.visible');
  });

  describe('Pie Chart', () => {
    it('displays Queries by Node chart with table', () => {
      cy.contains('Queries by Node').should('be.visible');
      // Verify the pie chart table has expected columns
      cy.contains('Queries by Node')
        .closest('.euiPanel')
        .within(() => {
          cy.contains('Query Count').should('be.visible');
          cy.contains('Percentage').should('be.visible');
        });
    });

    it('changes grouping via dropdown', () => {
      cy.contains('h3', 'Queries by Node')
        .closest('.euiPanel')
        .find('select')
        .first()
        .as('groupByDropdown');

      cy.get('@groupByDropdown').should('have.value', 'node');

      cy.get('@groupByDropdown').select('index');
      cy.contains('h3', 'Queries by Index').should('be.visible');

      cy.contains('h3', 'Queries by Index')
        .closest('.euiPanel')
        .find('select')
        .first()
        .select('username');
      cy.contains('h3', 'Queries by Username').should('be.visible');
    });

    it('table is sortable', () => {
      cy.contains('Queries by Node')
        .closest('.euiPanel')
        .within(() => {
          // Click Query Count header to sort
          cy.contains('Query Count').click();
          // Verify sorting changed (header should have sort indicator)
          cy.get('.euiTableHeaderCell').contains('Query Count').should('exist');
        });
    });
  });

  describe('Performance Analysis', () => {
    it('displays section with chart type toggle and metric dropdown', () => {
      cy.contains('h3', 'Performance Analysis').should('be.visible');
      cy.contains('h3', 'Performance Analysis')
        .closest('.euiPanel')
        .within(() => {
          // Chart type toggle visible
          cy.get('.euiButtonGroup').contains('Line Chart').should('be.visible');
          cy.get('.euiButtonGroup').contains('Heatmap').should('be.visible');
          // Metric dropdown works
          cy.get('select').first().as('metricDropdown');
          cy.get('@metricDropdown').should('have.value', 'latency');
          cy.get('@metricDropdown').select('cpu').should('have.value', 'cpu');
          cy.get('@metricDropdown')
            .select('memory')
            .should('have.value', 'memory');
        });
    });

    it('shows heatmap options and disables aggregation for Count metric', () => {
      cy.contains('h3', 'Performance Analysis')
        .closest('.euiPanel')
        .as('perfPanel');

      // Line Chart mode: Count not available, only 1 dropdown
      cy.get('@perfPanel').find('select').should('have.length', 1);
      cy.get('@perfPanel')
        .find('select')
        .first()
        .find('option')
        .should('not.contain', 'Count');

      // Switch to Heatmap
      cy.get('@perfPanel').find('.euiButtonGroup').contains('Heatmap').click();

      // Heatmap mode: 3 dropdowns (groupBy, metric, aggregation)
      cy.get('@perfPanel').find('select').should('have.length', 3);

      // GroupBy options
      cy.get('@perfPanel')
        .find('select')
        .first()
        .within(() => {
          cy.get('option').should('contain', 'Index');
          cy.get('option').should('contain', 'Node');
          cy.get('option').should('contain', 'Username');
        });

      // Aggregation options
      cy.get('@perfPanel')
        .find('select')
        .last()
        .within(() => {
          cy.get('option').should('contain', 'Avg');
          cy.get('option').should('contain', 'Max');
          cy.get('option').should('contain', 'Min');
        });

      // Count metric available and disables aggregation
      cy.get('@perfPanel').find('select').eq(1).select('count');
      cy.get('@perfPanel').find('select').last().should('be.disabled');

      // Switch back to Line Chart
      cy.get('@perfPanel')
        .find('.euiButtonGroup')
        .contains('Line Chart')
        .click();
      cy.get('@perfPanel').find('select').should('have.length', 1);
    });
  });
});

describe('Query Insights — DynamicSearchBar', () => {
  const SEARCH_PLACEHOLDER = 'e.g. latency >= 100 AND type = query';

  beforeEach(() => {
    cy.intercept('GET', '**/api/top_queries/**', (req) => {
      req.reply({ statusCode: 200, body: makeTimestampedBody(MIXED) });
    }).as('topQueries');

    cy.waitForQueryInsightsPlugin();
    // Force reload because testIsolation is disabled in this repo's cypress.config —
    // without it, cy.visit() to the same URL is a no-op and the intercepted request never fires.
    cy.reload();
    cy.wait('@topQueries', { timeout: 60000 });
  });

  it('renders the search bar with correct placeholder', () => {
    cy.get(`input[placeholder="${SEARCH_PLACEHOLDER}"]`).should('be.visible');
  });

  it('shows field suggestions when focused', () => {
    cy.get(`input[placeholder="${SEARCH_PLACEHOLDER}"]`).click();
    cy.get('[role="option"]').should('have.length.greaterThan', 0);
    cy.get('[role="option"]').first().should('contain.text', 'id');
  });

  it('shows operator suggestions after typing a field name and space', () => {
    cy.get(`input[placeholder="${SEARCH_PLACEHOLDER}"]`)
      .clear()
      .type('latency ');
    cy.get('[role="option"]').should('have.length.greaterThan', 0);
    cy.get('[role="option"]').should('contain.text', '=');
    cy.get('[role="option"]').should('contain.text', '>=');
    cy.get('[role="option"]').should('contain.text', 'between');
  });

  it('shows string operators for string fields', () => {
    cy.get(`input[placeholder="${SEARCH_PLACEHOLDER}"]`)
      .clear()
      .type('search_type ');
    cy.get('[role="option"]').should('contain.text', '=');
    cy.get('[role="option"]').should('contain.text', 'starts_with');
    cy.get('[role="option"]').should('contain.text', 'ends_with');
    cy.get('[role="option"]').should('contain.text', 'contains');
  });

  it('shows value suggestions after typing field and operator', () => {
    cy.get(`input[placeholder="${SEARCH_PLACEHOLDER}"]`)
      .clear()
      .type('search_type = ');
    cy.get('[role="option"]').should('have.length.greaterThan', 0);
  });

  it('shows conjunction suggestions after a complete condition', () => {
    cy.get(`input[placeholder="${SEARCH_PLACEHOLDER}"]`)
      .clear()
      .type('search_type = query_then_fetch ');
    cy.get('[role="option"]').should('contain.text', 'AND');
    cy.get('[role="option"]').should('contain.text', 'OR');
  });

  it('filters table by free text search', () => {
    cy.get(`input[placeholder="${SEARCH_PLACEHOLDER}"]`)
      .clear()
      .type('a2e1c822');
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableRow')
      .should('have.length.greaterThan', 0);
  });

  it('filters table by field = value expression', () => {
    cy.get(`input[placeholder="${SEARCH_PLACEHOLDER}"]`)
      .clear()
      .type('search_type = query_then_fetch');
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableRow')
      .should('have.length.greaterThan', 0);
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableRow')
      .first()
      .should('contain.text', 'query then fetch');
  });

  it('shows filter badges for active conditions', () => {
    cy.get(`input[placeholder="${SEARCH_PLACEHOLDER}"]`)
      .clear()
      .type('search_type = query_then_fetch ');
    cy.get('.euiBadge').contains('search_type').should('exist');
  });

  it('removes filter when badge X is clicked', () => {
    cy.get(`input[placeholder="${SEARCH_PLACEHOLDER}"]`)
      .clear()
      .type('search_type = query_then_fetch ');
    cy.get('.euiBadge')
      .contains('search_type')
      .closest('.euiBadge')
      .find('button, [role="img"], svg')
      .last()
      .click({ force: true });
    cy.get(`input[placeholder="${SEARCH_PLACEHOLDER}"]`).should(
      'have.value',
      ''
    );
  });

  it('supports AND conjunction between conditions', () => {
    cy.get(`input[placeholder="${SEARCH_PLACEHOLDER}"]`)
      .clear()
      .type('search_type = query_then_fetch AND node_id = ');
    cy.get('[role="option"]').should('have.length.greaterThan', 0);
  });

  it('auto-formats between expression with parentheses', () => {
    cy.get(`input[placeholder="${SEARCH_PLACEHOLDER}"]`)
      .clear()
      .type('latency between 100 500 ');
    cy.get(`input[placeholder="${SEARCH_PLACEHOLDER}"]`).should(
      'have.value',
      'latency between (100, 500) '
    );
  });

  it('shows no items when filter matches nothing', () => {
    cy.get(`input[placeholder="${SEARCH_PLACEHOLDER}"]`)
      .clear()
      .type('id = nonexistent_xyz_123');
    cy.get('.euiBasicTable')
      .last()
      .contains('No items found')
      .should('be.visible');
  });
});
