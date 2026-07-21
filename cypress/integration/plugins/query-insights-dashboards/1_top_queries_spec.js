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
 * Reload the overview page until the main Top N queries table is populated.
 *
 * The overview page fetches top queries exactly once per load (on mount) — it
 * does not poll. Under security the query-insights collection queue drains more
 * slowly, so the initial fetch can land before any queries are recorded and the
 * table renders its "No items found" empty state. Because nothing re-fetches, a
 * passive `.should('not.contain', 'No items found')` can never recover and just
 * times out. Reloading re-issues the fetch, which is what actually lets the data
 * appear.
 *
 * The empty-state check is scoped to the main data table (last `.euiBasicTable`
 * on the page, as the sort assertion below targets) rather than the whole body:
 * the page also renders a chart table whose own "No items found" state would
 * otherwise keep this loop retrying even after the main table populated. EUI
 * renders `noItemsMessage` inside a `.euiTableRow`, so a row-count check alone
 * passes on an empty table — match on the message text instead.
 *
 * Worst-case runtime is bounded to roughly 3 minutes so a genuine failure
 * surfaces in CI quickly rather than burning the full command timeout.
 */
const waitForTopQueriesTable = (attempts = 6) => {
  cy.get('.euiBasicTable', { timeout: 30000 })
    .last()
    .then(($table) => {
      if (!$table.text().includes('No items found')) {
        return;
      }
      if (attempts <= 0) {
        throw new Error('Top N queries table never populated after reloads');
      }
      cy.wait(3000);
      cy.reload();
      cy.contains('Query insights - Top N queries', { timeout: 30000 }).should(
        'be.visible'
      );
      waitForTopQueriesTable(attempts - 1);
    });
};

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
    // Ensure main table has data before attempting to sort. The page fetches
    // once on load and does not poll, so reload until the queue has drained and
    // the table is populated rather than waiting passively on a stale fetch.
    waitForTopQueriesTable();
    cy.get('.euiBasicTable', { timeout: 30000 })
      .last()
      .find('.euiTableRow')
      .should('have.length.greaterThan', 0);
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
      'WLM Group',
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
      'WLM Group',
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
      'WLM Group',
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
      'WLM Group',
    ];
    // assertRowCountEquals uses .should('have.length', N) which retries until items
    // has populated; once row count matches, columnsToShow has evaluated against the
    // populated data and headers are stable for the deep-equal assertion.
    assertRowCountEquals(getRowsFromRaw(QUERY_ONLY).length);
    getHeaders().should('deep.equal', expected);
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
    // assertRowCountEquals uses .should('have.length', N) which retries until items
    // has populated; once row count matches, columnsToShow has evaluated against the
    // populated data and headers are stable for the deep-equal assertion.
    assertRowCountEquals(getRowsFromRaw(GROUP_ONLY).length);
    getHeaders().should('deep.equal', expected);
  });

  it('renders no status badges in group-only view', () => {
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
    // The page fires three GETs (latency, cpu, memory) and only flips loading=false
    // after all three resolve. Wait for all three plus the table to render so the
    // visualizations panel is stable and React state has settled.
    cy.wait('@topQueries', { timeout: 60000 });
    cy.wait('@topQueries', { timeout: 60000 });
    cy.wait('@topQueries', { timeout: 60000 });
    cy.get('.euiBasicTable', { timeout: 30000 })
      .last()
      .find('.euiTableRow')
      .should('have.length.greaterThan', 0);
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
    // The page fires three GETs (latency, cpu, memory) and only flips loading=false
    // after all three resolve. The DynamicSearchBar is conditionally rendered on
    // `!loading`, so wait for all three plus the table to render before any test
    // interacts with the search input — otherwise the input may be detached/re-mounted
    // between Cypress commands, surfacing as a misleading 'disabled element' error.
    cy.wait('@topQueries', { timeout: 60000 });
    cy.wait('@topQueries', { timeout: 60000 });
    cy.wait('@topQueries', { timeout: 60000 });
    cy.get('.euiBasicTable', { timeout: 30000 })
      .last()
      .find('.euiTableRow')
      .should('have.length.greaterThan', 0);
    cy.get(`input[placeholder="${SEARCH_PLACEHOLDER}"]`).should('be.visible');
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

describe('Query Insights — Column Visibility', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/top_queries/**', (req) => {
      req.reply({ statusCode: 200, body: makeTimestampedBody(MIXED) });
    }).as('topQueries');

    // Clear localStorage before visiting so column preferences start fresh
    cy.clearLocalStorage('queryInsights_topn_visibleColumns');

    cy.waitForQueryInsightsPlugin();
    // Force reload because testIsolation is disabled in this repo's cypress.config —
    // without it, cy.visit() to the same URL is a no-op and the intercepted request never fires.
    cy.reload();
    cy.wait('@topQueries', { timeout: 60000 });

    // Ensure the table is rendered before interacting
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableHeaderCell')
      .should('have.length.greaterThan', 0);
  });

  it('displays the Columns button', () => {
    cy.get('[data-test-subj="column-visibility-button"]')
      .should('exist')
      .and('be.visible');
  });

  it('opens popover with column checkboxes on click', () => {
    cy.get('[data-test-subj="column-visibility-button"]').click();
    cy.get('[data-test-subj="column-visibility-show-all"]').should(
      'be.visible'
    );
    cy.get('[data-test-subj="column-visibility-hide-all"]').should(
      'be.visible'
    );
    cy.get('[data-test-subj^="column-toggle-"]').should(
      'have.length.greaterThan',
      0
    );
    // Close popover
    cy.get('body').click(0, 0);
  });

  // Opens the popover and waits for its content to be rendered/visible,
  // avoiding arbitrary fixed sleeps.
  const openColumnPopover = () => {
    cy.get('[data-test-subj="column-visibility-button"]').click();
    cy.get('[data-test-subj="column-visibility-show-all"]').should(
      'be.visible'
    );
  };

  // Closes the popover and waits for its content to be removed from the DOM.
  const closeColumnPopover = () => {
    cy.get('[data-test-subj="column-visibility-button"]').click();
    cy.get('[data-test-subj="column-visibility-show-all"]').should('not.exist');
  };

  it('hides a column when unchecked', () => {
    // Verify Indices column is visible initially
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableHeaderCell')
      .contains('Indices')
      .should('exist');

    // Open popover and toggle "Indices" column off
    openColumnPopover();
    cy.get('[data-test-subj="column-toggle-indices"]').click({ force: true });
    closeColumnPopover();

    // Verify "Indices" header is gone
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableHeaderCell')
      .contains('Indices')
      .should('not.exist');
  });

  it('shows a column when checked', () => {
    // First hide Indices
    openColumnPopover();
    cy.get('[data-test-subj="column-toggle-indices"]').click({ force: true });
    closeColumnPopover();
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableHeaderCell')
      .contains('Indices')
      .should('not.exist');

    // Now show it again
    openColumnPopover();
    cy.get('[data-test-subj="column-toggle-indices"]').click({ force: true });
    closeColumnPopover();

    // Verify "Indices" header is back
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableHeaderCell')
      .contains('Indices')
      .should('exist');
  });

  it('ID column checkbox is disabled (pinned)', () => {
    openColumnPopover();
    cy.get('[data-test-subj="column-toggle-id"]').should('be.disabled');
    closeColumnPopover();
  });

  it('Show all makes all columns visible', () => {
    // First hide a column
    openColumnPopover();
    cy.get('[data-test-subj="column-toggle-type"]').click({ force: true });
    closeColumnPopover();
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableHeaderCell')
      .contains('Type')
      .should('not.exist');

    // Open popover and click Show all
    openColumnPopover();
    cy.get('[data-test-subj="column-visibility-show-all"]').click();
    closeColumnPopover();

    // Verify Type column is back
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableHeaderCell')
      .contains('Type')
      .should('exist');
  });

  it('Hide all keeps only pinned columns', () => {
    openColumnPopover();
    cy.get('[data-test-subj="column-visibility-hide-all"]').click();
    closeColumnPopover();

    // Only "Id" should remain (pinned)
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableHeaderCell')
      .should('have.length', 1);
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableHeaderCell')
      .contains('Id')
      .should('exist');
  });
});
