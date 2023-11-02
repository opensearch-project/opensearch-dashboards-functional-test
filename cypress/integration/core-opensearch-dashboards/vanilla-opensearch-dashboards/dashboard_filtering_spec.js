/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TestFixtureHandler,
  CommonUI,
  DashboardPage,
  MiscUtils,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

/**
 * dashboard_filtering test suite description:
 * 1) Create a new dashboard, and populate it with visualizations
 * 2) Set a filter that excludes all data, and check the visualizations for proper updates
 * 3) Set the existing filter to be pinned, re-check the visualizations
 * 4) Remove the filter, and check the visualizations for proper updates
 * 5) Create a new dashboard, and populate it with a pie graph
 * 6) Apply different filters to the pie graph and check the pie graph for proper updates
 * 7) Remove all filters and ensure that the pie graph reverts to its original format
 * 8) Test adding another pie graph to the dashboard and applying a filter to both graphs
 */

const testFixtureHandler = new TestFixtureHandler(
  cy,
  Cypress.env('openSearchUrl')
);
const commonUI = new CommonUI(cy);
const dashboardPage = new DashboardPage(cy);
const miscUtils = new MiscUtils(cy);
describe('dashboard filtering', () => {
  before(() => {
    testFixtureHandler.clearJSONMapping(
      'cypress/fixtures/dashboard/data/mappings.json.txt'
    );

    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/mappings.json.txt'
    );
    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/data/mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data.json.txt'
    );
    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/data/data.json.txt'
    );
  });

  after(() => {
    testFixtureHandler.clearJSONMapping(
      'cypress/fixtures/dashboard/data/mappings.json.txt'
    );
  });

  // The commands that run in "before" and "beforeEach" hooks take place
  // during the first test in the test suite associated with them.
  // Since importing the test environment stores large amounts of information in local memory,
  // the test that the "before" hook above runs in tends to run significantly slower.
  // This buffer test below helps prevent unnecessary slowdown during testing
  it('Buffer test for importing test environment data', () => {});

  describe('Adding and removing filters from a dashboard', () => {
    before(() => {
      // Go to the Dashboards list page
      miscUtils.visitPage('app/dashboards/list');

      // Click the "Create dashboard" button
      miscUtils.createNewDashboard();
      // Change the time to be between Jan 1 2018 and Apr 13, 2018
      cy.setTopNavDate(
        'Jan 1, 2018 @ 00:00:00.000',
        'Apr 13, 2018 @ 00:00:00.000'
      );

      // Add all "Filter Bytes Test" visualizations
      dashboardPage.addDashboardPanels(
        'Filter Bytes Test',
        'visualization',
        true
      );

      // Click the "Add" button and add all "Saved Searches"
      dashboardPage.addDashboardPanels('Filter Bytes Test', 'search', false);
    });

    describe('adding a filter that excludes all data', () => {
      before(() => {
        // Clear add filters to properly clean the environment for the test
        commonUI.removeAllFilters();

        // Add filter
        commonUI.addFilterRetrySelection('bytes', 'is', '12345678');
      });

      it('Nonpinned filter: filters on pie charts', () => {
        // Check that none of the pie charts are occupied with data (show "No results found")
        commonUI.checkElementDoesNotExist('svg > g > g.arcs > path.slice');
      });

      it('Nonpinned filter: area, bar and heatmap charts filtered', () => {
        // Check that none of the charts are filled with data
        commonUI.checkElementDoesNotExist('svg > g > g.series');
      });

      it('Nonpinned filter: data tables are filtered', () => {
        // Check that none of the data tables are filled with data
        commonUI.checkElementDoesNotExist('[data-test-subj="dataGridRowCell"]');
      });

      it('Nonpinned filter: goal and guages are filtered', () => {
        // Goal label should be 0, gauge label should be 0%
        commonUI.checkValuesExistInComponent('svg > g > g > text.chart-label', [
          '0',
          '0%',
        ]);
      });

      it('Nonpinned filter: tsvb time series shows no data message', () => {
        // The no data message should be visible
        commonUI.checkElementExists('[data-test-subj="noTSVBDataMessage"]', 1);
      });

      it('Nonpinned filter: metric value shows no data', () => {
        // The metrics should show '-'
        commonUI.checkValuesExistInComponent('.mtrVis__value', [' - ']);
      });

      it('Nonpinned filter: tag cloud values are filtered', () => {
        commonUI.checkElementComponentDoesNotExist(
          '[data-test-subj="tagCloudVisualization"]',
          'svg > g > text'
        );
      });

      it('Nonpinned filter: tsvb metric is filtered', () => {
        commonUI.checkValuesExistInComponent(
          '[data-test-subj="tsvbMetricValue"]',
          ['0 custom template']
        );
      });

      it('Nonpinned filter: tsvb top n is filtered', () => {
        commonUI.checkElementContainsValue(
          '[data-test-subj="tsvbTopNValue"]',
          2,
          '0'
        );
      });

      it('Nonpinned filter: saved search is filtered', () => {
        commonUI.checkElementDoesNotExist(
          '[data-test-subj="docTableExpandToggleColumn"]'
        );
      });

      it('Nonpinned filter: vega is filtered', () => {
        commonUI.checkValuesDoNotExistInComponent('.vgaVis__view text', [
          '5,000',
        ]);
      });
    });

    describe('using a pinned filter that excludes all data', () => {
      before(() => {
        // Clear add filters to properly clean environment for the test
        commonUI.removeAllFilters();

        commonUI.addFilterRetrySelection('bytes', 'is', '12345678');

        commonUI.pinFilter('bytes');
      });

      it('Pinned filter: filters on pie charts', () => {
        // Check that none of the pie charts are occupied with data (show "No results found")
        commonUI.checkElementDoesNotExist('svg > g > g.arcs > path.slice');
      });

      it('Pinned filter: area, bar and heatmap charts filtered', () => {
        // Check that none of the charts are filled with data
        commonUI.checkElementDoesNotExist('svg > g > g.series');
      });

      it('Pinned filter: data tables are filtered', () => {
        // Check that none of the data tables are filled with data
        commonUI.checkElementDoesNotExist('[data-test-subj="dataGridRowCell"]');
      });

      it('Pinned filter: goal and guages are filtered', () => {
        // Goal label should be 0, gauge label should be 0%
        commonUI.checkValuesExistInComponent('svg > g > g > text.chart-label', [
          '0',
          '0%',
        ]);
      });

      it('Pinned filter: metric value shows no data', () => {
        // The metrics should show '-'
        commonUI.checkValuesExistInComponent('.mtrVis__value', [' - ']);
      });

      it('Pinned filter: tag cloud values are filtered', () => {
        commonUI.checkElementComponentDoesNotExist(
          '[data-test-subj="tagCloudVisualization"]',
          'svg > g > text'
        );
      });

      it('Pinned filter: tsvb metric is filtered', () => {
        commonUI.checkValuesExistInComponent(
          '[data-test-subj="tsvbMetricValue"]',
          ['0 custom template']
        );
      });

      it('Pinned filter: tsvb top n is filtered', () => {
        commonUI.checkElementContainsValue(
          '[data-test-subj="tsvbTopNValue"]',
          2,
          '0'
        );
      });

      it('Pinned filter: saved search is filtered', () => {
        commonUI.checkElementDoesNotExist(
          '[data-test-subj="docTableExpandToggleColumn"]'
        );
      });

      it('Pinned filter: vega is filtered', () => {
        commonUI.checkValuesDoNotExistInComponent('.vgaVis__view text', [
          '5,000',
        ]);
      });
    });

    describe('disabling a filter unfilters the data on', () => {
      before(() => {
        // TO DO: create delete filter helper function
        // Clear add filters to properly clean environment for the test
        commonUI.removeAllFilters();

        commonUI.addFilterRetrySelection('bytes', 'is', '12345678');

        commonUI.removeFilter('bytes');
      });

      it('Filter disabled: pie charts', () => {
        // Check that there are 5 slice in the pie charts
        commonUI.checkElementExists('svg > g > g.arcs > path.slice', 5);
      });

      it('Filter disabled: area, bar and heatmap charts', () => {
        // Check that there are 3 charts
        commonUI.checkElementExists('svg > g > g.series', 3);
      });

      it('Filter disabled: data tables', () => {
        // Check that there are 20 table cells / 10 rows
        commonUI.checkElementExists('[data-test-subj="dataGridRowCell"]', 20);
      });

      it.skip('Filter disabled: goal and guages', () => {
        // Goal label should be 7,544, and the gauge label should be 39.958%%
        // Inconsistency: original code says that the goal label should have "7,544",
        // but sometimes the goal displays "7,565". It may have been related to a
        // data loading issue.
        commonUI.checkValuesExistInComponent('svg > g > g > text.chart-label', [
          '7,544',
          '39.958%',
        ]);
      });

      it('Filter disabled: metric value', () => {
        // The metrics should show '101'
        commonUI.checkValuesExistInComponent('.mtrVis__value', ['101']);
      });

      it('Filter disabled: tag cloud', () => {
        commonUI.checkValuesExistInComponent(
          '[data-test-subj="tagCloudVisualization"]',
          ['9,972', '4,886', '1,944', '9,025']
        );
      });

      it('Filter disabled: tsvb metric', () => {
        commonUI.checkValuesExistInComponent(
          '[data-test-subj="tsvbMetricValue"]',
          ['50,465 custom template']
        );
      });

      it('Filter disabled: tsvb top n', () => {
        commonUI.checkElementContainsValue(
          '[data-test-subj="tsvbTopNValue"]',
          2,
          '6,308.125'
        );
      });

      it('Filter disabled: tsvb markdown', () => {
        commonUI.checkValuesExistInComponent(
          '[data-test-subj="tsvbMarkdown"]',
          ['7,209.286']
        );
      });

      it('Filter disabled: saved search is filtered', () => {
        commonUI.checkElementExists(
          '[data-test-subj="docTableExpandToggleColumn"]',
          1
        );
      });

      it('Filter disabled: vega is filtered', () => {
        commonUI.checkValuesExistInComponent('.vgaVis__view text', ['5,000']);
      });
    });
  });
  // TO DO: continue making helper functions for repeated actions.
  // TO DO: better subdivide the nested filtering tests to improve consistency.
  // For example, if the test runner stops after renaming the "Rendering Test: animal sounds pie"
  // visualization, future runs of the test suite will fail due to being unable to find the visualization
  // under the expected name.

  describe('nested filtering', () => {
    before(() => {
      // Go to the Dashboards list page
      miscUtils.visitPage('app/dashboards/list');

      // Click the "Create dashboard" button
      miscUtils.createNewDashboard(20000);

      // Change the time to be between Jan 1 2018 and Apr 13, 2018
      cy.setTopNavDate(
        'Jan 1, 2018 @ 00:00:00.000',
        'Apr 13, 2018 @ 00:00:00.000'
      );

      dashboardPage.addDashboardPanels(
        'Rendering Test: animal sounds pie',
        'visualization',
        false
      );
    });

    it('visualization saved with a query filters data', () => {
      commonUI.checkElementExists('svg > g > g.arcs > path.slice', 5);

      dashboardPage.openVisualizationContextMenu(
        'Rendering Test: animal sounds pie'
      );
      dashboardPage.clickEditVisualization();

      miscUtils.setQuery('weightLbs:>50');
      commonUI.checkElementExists('svg > g > g.arcs > path.slice', 3);

      dashboardPage.saveDashboardVisualization(
        'Rendering Test: animal sounds pie',
        false,
        false
      );

      miscUtils.goToDashboardPage();
      commonUI.checkElementExists('svg > g > g.arcs > path.slice', 3);
    });

    it('Nested visualization filter pills filters data as expected', () => {
      dashboardPage.openVisualizationContextMenu(
        'Rendering Test: animal sounds pie'
      );
      dashboardPage.clickEditVisualization();

      commonUI.pieChartFilterOnSlice('grr');
      commonUI.checkElementExists('svg > g > g.arcs > path.slice', 1);

      dashboardPage.saveDashboardVisualization(
        'animal sounds pie',
        false,
        false
      );

      miscUtils.goToDashboardPage();
      commonUI.checkElementExists('svg > g > g.arcs > path.slice', 1);
    });

    it('Removing filter pills and query unfiters data as expected', () => {
      dashboardPage.openVisualizationContextMenu('animal sounds pie');
      dashboardPage.clickEditVisualization();

      miscUtils.removeQuery();
      commonUI.pieChartRemoveFilter('sound.keyword');
      commonUI.checkElementExists('svg > g > g.arcs > path.slice', 5);

      dashboardPage.saveDashboardVisualization(
        'Rendering Test: animal sounds pie',
        false,
        false
      );
      miscUtils.goToDashboardPage();

      commonUI.checkElementExists('svg > g > g.arcs > path.slice', 5);
    });
    it('Pie chart linked to saved search filters data', () => {
      dashboardPage.addDashboardPanels(
        'Filter Test: animals: linked to search with filter',
        'visualization',
        false
      );
      commonUI.checkElementExists('svg > g > g.arcs > path.slice', 7);
    });

    it('Pie chart linked to saved search filters shows no data with conflicting dashboard query', () => {
      miscUtils.setQuery('weightLbs<40');
      commonUI.checkElementExists('svg > g > g.arcs > path.slice', 5);
    });
  });
});
