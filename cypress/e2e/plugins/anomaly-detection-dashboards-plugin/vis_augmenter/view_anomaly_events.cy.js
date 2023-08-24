/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  deleteVisAugmenterData,
  bootstrapDashboard,
  openAddAnomalyDetectorFlyout,
  createDetectorFromVis,
  unlinkDetectorFromVis,
  ensureDetectorIsLinked,
  openViewEventsFlyout,
} from '../../../../utils/helpers';
import {
  INDEX_PATTERN_FILEPATH_SIMPLE,
  INDEX_SETTINGS_FILEPATH_SIMPLE,
  SAMPLE_DATA_FILEPATH_SIMPLE,
} from '../../../../utils/constants';

describe('View anomaly events in flyout', () => {
  const indexName = 'ad-vis-augmenter-sample-index';
  const indexPatternName = 'ad-vis-augmenter-sample-*';
  const dashboardName = 'AD Vis Augmenter Dashboard';
  const detectorName = 'ad-vis-augmenter-detector';
  const visualizationName = 'single-metric-vis';
  const visualizationSpec = {
    name: visualizationName,
    type: 'line',
    indexPattern: indexPatternName,
    metrics: [
      {
        aggregation: 'Average',
        field: 'value1',
      },
    ],
  };

  before(() => {
    // Create a dashboard and add some visualizations
    cy.wait(5000);
    bootstrapDashboard(
      INDEX_SETTINGS_FILEPATH_SIMPLE,
      INDEX_PATTERN_FILEPATH_SIMPLE,
      SAMPLE_DATA_FILEPATH_SIMPLE,
      indexName,
      indexPatternName,
      dashboardName,
      [visualizationSpec]
    );
  });

  after(() => {
    deleteVisAugmenterData(
      indexName,
      indexPatternName,
      [visualizationName],
      dashboardName
    );
    cy.deleteADSystemIndices();
  });

  beforeEach(() => {});

  afterEach(() => {});

  it('Action does not exist if there are no VisLayers for a visualization', () => {
    cy.getVisPanelByTitle(visualizationName)
      .openVisContextMenu()
      .getMenuItems()
      .contains('View Events')
      .should('not.exist');
  });

  it('Action does exist if there are VisLayers for a visualization', () => {
    openAddAnomalyDetectorFlyout(dashboardName, visualizationName);
    createDetectorFromVis(detectorName);
    ensureDetectorIsLinked(dashboardName, visualizationName, detectorName);

    cy.visitDashboard(dashboardName);
    cy.getVisPanelByTitle(visualizationName)
      .openVisContextMenu()
      .getMenuItems()
      .contains('View Events')
      .should('exist');
  });

  it('Basic components show up in flyout', () => {
    openViewEventsFlyout(dashboardName, visualizationName);
    cy.get('.euiFlyoutHeader').contains(visualizationName);
    cy.getElementByTestId('baseVis');
    cy.getElementByTestId('eventVis');
    cy.getElementByTestId('timelineVis');
    cy.getElementByTestId('pluginResourceDescription');
    cy.getElementByTestId('pluginResourceDescription').within(() => {
      cy.contains(detectorName);
      cy.get('.euiLink');
      cy.get(`[target="_blank"]`);
    });
  });

  it('Removing all VisLayers hides the view events action again', () => {
    unlinkDetectorFromVis(dashboardName, visualizationName, detectorName);
    cy.visitDashboard(dashboardName);
    cy.getVisPanelByTitle(visualizationName)
      .openVisContextMenu()
      .getMenuItems()
      .contains('View Events')
      .should('not.exist');
  });
});
