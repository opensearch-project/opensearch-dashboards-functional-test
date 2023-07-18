/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_FILEPATH_SIMPLE,
  INDEX_SETTINGS_FILEPATH_SIMPLE,
  SAMPLE_DATA_FILEPATH_SIMPLE,
} from '../../../../../utils/constants';
import {
  deleteVisAugmenterData,
  bootstrapDashboard,
  validateVisSnapshot,
  setDateRangeTo7Days,
} from '../../../../../utils/dashboards/vis-augmenter/helpers';

describe('Vis augmenter - existing dashboards work as expected', () => {
  describe('dashboard with ineligible, eligible, and vega visualizations', () => {
    const indexName = 'vis-augmenter-sample-index';
    const indexPatternName = 'vis-augmenter-sample-*';
    const dashboardName = 'Vis Augmenter Dashboard';
    const visualizationSpecs = [
      {
        name: 'count-agg-vis',
        type: 'line',
        indexPattern: indexPatternName,
        metrics: [],
      },
      {
        name: 'single-metric-vis',
        type: 'line',
        indexPattern: indexPatternName,
        metrics: [
          {
            aggregation: 'Average',
            field: 'value1',
          },
        ],
      },
      {
        name: 'multi-metric-vis',
        type: 'line',
        indexPattern: indexPatternName,
        metrics: [
          {
            aggregation: 'Average',
            field: 'value1',
          },
          {
            aggregation: 'Average',
            field: 'value2',
          },
          {
            aggregation: 'Max',
            field: 'value3',
          },
        ],
      },
      {
        name: 'area-vis',
        type: 'area',
        indexPattern: indexPatternName,
        metrics: [
          {
            aggregation: 'Max',
            field: 'value2',
          },
        ],
      },
      {
        name: 'vega-vis',
        type: 'vega',
        indexPattern: indexPatternName,
        metrics: [],
      },
    ];

    const visualizationNames = visualizationSpecs.map(
      (visualizationSpec) => visualizationSpec.name
    );

    before(() => {
      // Create a dashboard and add some visualizations
      bootstrapDashboard(
        INDEX_SETTINGS_FILEPATH_SIMPLE,
        INDEX_PATTERN_FILEPATH_SIMPLE,
        SAMPLE_DATA_FILEPATH_SIMPLE,
        indexName,
        indexPatternName,
        dashboardName,
        visualizationSpecs
      );
      // Setting viewport so the snapshots in the tests are consistent
      cy.viewport(1280, 720);
    });

    beforeEach(() => {
      cy.visitDashboard(dashboardName);
    });

    after(() => {
      deleteVisAugmenterData(
        indexName,
        indexPatternName,
        visualizationNames,
        dashboardName
      );
    });

    it('View events option does not exist for any visualization', () => {
      // Change date range to 7 days so there is less variability in charts
      // which can cause flakiness (e.g., chart snapshot comparisons).
      setDateRangeTo7Days();

      visualizationNames.forEach((visualizationName) => {
        // Validating after making each vis full-screen. This is because if there
        // is a lot of visualizations on the screen, not all may be visible at the
        // same time on the dashboard - some may require scrolling to be in view.
        validateVisSnapshot(
          visualizationName,
          `${visualizationName}-last-7-days`,
          true
        );
        cy.getVisPanelByTitle(visualizationName)
          .openVisContextMenu()
          .getMenuItems()
          .contains('View Events')
          .should('not.exist');
        cy.getVisPanelByTitle(visualizationName).closeVisContextMenu();
      });
    });

    it('Validate non-vega visualizations are not rendered with vega under the hood', () => {
      visualizationSpecs.forEach((visualizationSpec) => {
        cy.getVisPanelByTitle(visualizationSpec.name).within(() => {
          if (visualizationSpec.type === 'vega') {
            cy.get('.vgaVis__view').should('exist');
          } else {
            cy.get('.vgaVis__view').should('not.exist');
          }
        });
      });
    });
  });
});
