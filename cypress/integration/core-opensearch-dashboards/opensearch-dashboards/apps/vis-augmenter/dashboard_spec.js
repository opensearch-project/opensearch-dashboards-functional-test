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
      // This is working and is fetching snapshots as expected.
      // The problem is the viewport size is too small such that not all charts
      // are fully visible where the snapshots are cut off. Need to either expand
      // the viewport (make sure it still passes if headless?), or find a way to focus
      // on the divs better somehow.
      cy.viewport(1280, 720);
      visualizationNames.forEach((visualizationName) => {
        cy.wait(2000);
        cy.get(`[data-title="${visualizationName}"]`).matchImageSnapshot(
          visualizationName
        );
        cy.wait(2000);
        cy.getVisPanelByTitle(visualizationName)
          .openVisContextMenu()
          .getMenuItems()
          .contains('View Events')
          .should('not.exist');
        cy.getVisPanelByTitle(visualizationName).closeVisContextMenu();
      });
    });

    it.skip('Validate non-vega visualizations are not rendered with vega under the hood', () => {
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
