/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import sampleDocument from '../../../fixtures/plugins/query-insights-dashboards/sample_document.json';
import { QUERY_INSIGHTS_METRICS } from '../../../utils/constants';

import MIXED from '../../../fixtures/stub_top_queries.json';
import QUERY_ONLY from '../../../fixtures/stub_top_queries_query_only.json';
import GROUP_ONLY from '../../../fixtures/stub_top_queries_group_only.json';

// Workaround: Cypress 9.x may re-register describe blocks from previously run
// spec files when using --spec glob patterns in the same browser session. This
// guard skips the suite when loaded outside its own spec file. It is a no-op in
// Cypress 13+ where each spec runs in full isolation. Safe to remove after the
// Cypress upgrade.
const _describe = Cypress.spec.name.includes('1_top_queries')
  ? describe
  : describe.skip;

const makeTimestampedBody = (raw) => {
  const body = JSON.parse(JSON.stringify(raw));
  const list = body?.response?.top_queries ?? body?.top_queries ?? [];
  const now = Date.now();
  body.response = body.response || {};
  body.response.top_queries = list.map((q, i) => ({ ...q, timestamp: now - i * 1000 }));
  return body;
};

const getRowsFromRaw = (raw) => (raw?.response?.top_queries ?? raw?.top_queries ?? []).slice();

const assertRowCountEquals = (expected) => {
  // Target the main data table (last table on page), not the chart table
  cy.get('.euiBasicTable').last().find('.euiTableRow').should('have.length', expected);
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

const expectSortedBy = (label, colIdx) => {
  const extract = ($rows) =>
    [...$rows].map(($r) => {
      const txt = Cypress.$($r).find('td').eq(colIdx).text().trim();
      if (/ms|s|B|KB|MB|GB|TB/i.test(txt)) return parseFloat(txt.replace(/[^\d.]/g, '')) || 0;
      const ms = Date.parse(txt);
      if (!Number.isNaN(ms)) return ms;
      const num = parseFloat(txt.replace(/[^\d.-]/g, ''));
      return Number.isNaN(num) ? 0 : num;
    });

  // Target the main data table (last table on page)
  cy.get('.euiBasicTable').last().find('.euiTableHeaderCell').contains(label).click();
  cy.get('.euiBasicTable')
    .last()
    .find('.euiTableRow')
    .then(($r) => {
      const v = extract($r);
      const asc = [...v].sort((a, b) => a - b);
      expect(v, `${label} asc`).to.deep.equal(asc);
    });

  cy.get('.euiBasicTable').last().find('.euiTableHeaderCell').contains(label).click();
  cy.get('.euiBasicTable')
    .last()
    .find('.euiTableRow')
    .then(($r) => {
      const v = extract($r);
      const desc = [...v].sort((a, b) => b - a);
      expect(v, `${label} desc`).to.deep.equal(desc);
    });
};

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();

const findFilterButton = (labels) => {
  const candidates = (Array.isArray(labels) ? labels : [labels]).map(norm);

  return cy.get('button.euiFilterButton').then(($btns) => {
    const found = [...$btns].find((btn) => {
      const txt = norm(btn.innerText);
      const aria = norm(btn.getAttribute('aria-label'));
      const title = norm(btn.getAttribute('title'));
      const subj = norm(btn.getAttribute('data-test-subj'));
      return candidates.some(
        (lab) =>
          txt.includes(lab) || aria.includes(lab) || title.includes(lab) || subj.includes(lab)
      );
    });

    if (!found) {
      const dump = [...$btns]
        .map(
          (el) =>
            norm(el.innerText) ||
            norm(el.getAttribute('aria-label')) ||
            norm(el.getAttribute('title')) ||
            norm(el.getAttribute('data-test-subj'))
        )
        .join(' | ');
      throw new Error(
        `Filter button not found. Tried [${candidates.join(', ')}]. Buttons seen: ${dump}`
      );
    }

    return cy.wrap(found);
  });
};

const openFilter = (labels) => {
  findFilterButton(labels).scrollIntoView().click();
  cy.get('.euiSelectableListItem', { timeout: 10000 }).should('exist');
};

const clearAllOpenFilterOptions = () => {
  cy.get('.euiSelectableListItem').each(($item) => {
    // Check if item is selected by looking for the check icon or euiSelectableListItem-isChecked class
    const hasCheck =
      $item.find('[data-euiicon-type="check"]').length > 0 ||
      $item.hasClass('euiSelectableListItem-isChecked') ||
      $item.attr('aria-checked') === 'true';
    if (hasCheck) {
      cy.wrap($item).click();
    }
  });
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const setListFilter = (buttonLabels, values = []) => {
  openFilter(buttonLabels);
  clearAllOpenFilterOptions();
  values.forEach((label) => {
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cy.contains('.euiSelectableListItem', new RegExp(`^${esc(label)}$`, 'i'))
      .scrollIntoView()
      .click();
  });
  cy.get('body').click(0, 0);
  cy.wait(300);
};

const setNodeIdFilter = (nodeIds = []) => setListFilter(['Coordinator Node ID'], nodeIds);
const setSearchTypeFilter = (types = []) => setListFilter(['Search Type'], types);
const setIndicesFilter = (indices = []) => setListFilter(['Indices'], indices);

const setTypeFilter = (mode /* 'query' | 'group' | 'both' */) => {
  // Click the Type filter button (in the filter group, not visualization toggle)
  findFilterButton(['Type']).click();
  cy.get('.euiSelectableListItem', { timeout: 10000 }).should('exist');

  const ensureToggle = (label, shouldBeOn) => {
    cy.contains('.euiSelectableListItem', new RegExp(`^${esc(label)}$`, 'i')).then(($item) => {
      const isOn = $item.attr('aria-checked') === 'true';
      if (isOn !== shouldBeOn) {
        cy.wrap($item).click();
      }
    });
  };

  if (mode === 'query') {
    ensureToggle('query', true);
    ensureToggle('group', false);
  } else if (mode === 'group') {
    ensureToggle('query', false);
    ensureToggle('group', true);
  } else {
    ensureToggle('query', true);
    ensureToggle('group', true);
  }
  cy.get('body').click(0, 0);
  cy.wait(300);
};

const resetTypeFilterToNone = () => {
  // Click the Type filter button to open the popover
  findFilterButton(['Type']).click();
  cy.get('.euiSelectableListItem', { timeout: 10000 }).should('exist');

  cy.contains('.euiSelectableListItem', /^query$/i).then(($item) => {
    if ($item.attr('aria-checked') === 'true') {
      cy.wrap($item).click();
    }
  });

  cy.contains('.euiSelectableListItem', /^group$/i).then(($item) => {
    if ($item.attr('aria-checked') === 'true') {
      cy.wrap($item).click();
    }
  });

  cy.get('body').click(0, 0);
  cy.wait(500);
};

const deriveExpectations = (payload, type = 'all') => {
  const allRows = getRowsFromRaw(payload);

  let rows = allRows;
  if (type === 'query') {
    rows = allRows.filter((r) => String(r.group_by).toUpperCase() === 'NONE');
  } else if (type === 'group') {
    rows = allRows.filter((r) => String(r.group_by).toUpperCase() !== 'NONE');
  }

  const uniq = (arr) => [...new Set(arr)];
  const countBy = (items, keyFn) =>
    items.reduce((acc, item) => {
      const k = keyFn(item);
      if (Array.isArray(k)) {
        k.filter(Boolean).forEach((kk) => {
          acc[kk] = (acc[kk] || 0) + 1;
        });
      } else if (k) {
        acc[k] = (acc[k] || 0) + 1;
      }
      return acc;
    }, {});

  const nodeIds = uniq(rows.map((r) => r.node_id).filter(Boolean));
  const indexNames = uniq(rows.flatMap((r) => r.indices || []).filter(Boolean));
  const searchTypes = uniq(rows.map((r) => r.search_type).filter(Boolean));

  return {
    appliedType: type,
    rows,
    totalRowCount: rows.length,
    nodeIds,
    nodeIdCounts: countBy(rows, (r) => r.node_id),
    indexNames,
    indexCounts: countBy(rows, (r) => r.indices || []),
    searchTypes,
    searchTypeCounts: countBy(rows, (r) => r.search_type),
  };
};

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
  cy.disableGrouping();
};

_describe('Query Insights Dashboard', () => {
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
    cy.get('.euiBasicTable').last().find('.euiTableRow').should('have.length.greaterThan', 0);
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
    cy.get('.euiBasicTable').last().find('.euiTableHeaderCell').contains('Timestamp').click();
    // eslint-disable-next-line jest/valid-expect-in-promise
    cy.get('.euiBasicTable')
      .last()
      .find('.euiTableRow')
      .first()
      .invoke('text')
      .then((firstRowAfterSort) => {
        const firstTimestamp = firstRowAfterSort.trim();
        cy.get('.euiBasicTable').last().find('.euiTableHeaderCell').contains('Timestamp').click();
        // eslint-disable-next-line jest/valid-expect-in-promise
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
    cy.get('.euiBasicTable').last().find('.euiTableRow').should('have.length.greaterThan', 0);
  });

  after(() => clearAll());
});

_describe('Query Insights — Dynamic Columns with Intercepted Top Queries (MIXED)', () => {
  const mixedRows = getRowsFromRaw(MIXED);
  const totalRowCount = mixedRows.length;

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

    const queryOnlyCount = mixedRows.filter((r) => String(r.group_by).toUpperCase() === 'NONE')
      .length;
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

    const groupOnlyCount = mixedRows.filter((r) => String(r.group_by).toUpperCase() !== 'NONE')
      .length;
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
_describe('Query Insights — Dynamic Columns (QUERY ONLY fixture)', () => {
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
_describe('Query Insights — Dynamic Columns (GROUP ONLY fixture)', () => {
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

_describe('Query Insights — Filters and Search', () => {
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

_describe('Query Insights — Stats & Visualizations Panel', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/top_queries/**', (req) => {
      req.reply({ statusCode: 200, body: makeTimestampedBody(MIXED) });
    }).as('topQueries');

    cy.waitForQueryInsightsPlugin();
    cy.wait('@topQueries');
  });

  it('displays visualizations panel with Query/Group toggle', () => {
    cy.get('[data-test-subj="visualizationModeToggle"]').contains('Query').should('be.visible');
    cy.get('[data-test-subj="visualizationModeToggle"]').contains('Group').should('be.visible');
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
    cy.get('[data-test-subj="visualizationModeToggle"]').contains('Group').click();
    cy.contains('No Visualization Available').should('be.visible');
    cy.contains('Visualizations for grouped queries are coming soon').should('be.visible');
  });

  it('switches back to Query mode and shows visualizations', () => {
    cy.get('[data-test-subj="visualizationModeToggle"]').contains('Group').click();
    cy.contains('No Visualization Available').should('be.visible');
    cy.get('[data-test-subj="visualizationModeToggle"]').contains('Query').click();
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
          cy.get('@metricDropdown').select('memory').should('have.value', 'memory');
        });
    });

    it('shows heatmap options and disables aggregation for Count metric', () => {
      cy.contains('h3', 'Performance Analysis').closest('.euiPanel').as('perfPanel');

      // Line Chart mode: Count not available, only 1 dropdown
      cy.get('@perfPanel').find('select').should('have.length', 1);
      cy.get('@perfPanel').find('select').first().find('option').should('not.contain', 'Count');

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
      cy.get('@perfPanel').find('.euiButtonGroup').contains('Line Chart').click();
      cy.get('@perfPanel').find('select').should('have.length', 1);
    });
  });
});
