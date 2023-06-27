/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSampleDetector,
  deleteVisAugmenterData,
  bootstrapDashboard,
  openAddAnomalyDetectorFlyout,
  openAssociatedDetectorsFlyout,
  createDetectorFromVis,
  associateDetectorFromVis,
  unlinkDetectorFromVis,
  ensureDetectorIsLinked,
} from '../../../../utils/helpers';
import {
  INDEX_PATTERN_FILEPATH_SIMPLE,
  INDEX_SETTINGS_FILEPATH_SIMPLE,
  SAMPLE_DATA_FILEPATH_SIMPLE,
} from '../../../../utils/constants';

describe('Associate a detector to a visualization', () => {
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
    //cy.deleteADSystemIndices();
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
    // cy.deleteAllIndices();
  });

  after(() => {
    deleteVisAugmenterData(
      indexName,
      indexPatternName,
      [visualizationName],
      dashboardName
    );
    // cy.deleteAllIndices();
    cy.deleteADSystemIndices();
  });

  beforeEach(() => {});

  afterEach(() => {});

  it('Create new detector from visualization', () => {
    openAddAnomalyDetectorFlyout(dashboardName, visualizationName);
    createDetectorFromVis(detectorName);

    ensureDetectorIsLinked(dashboardName, visualizationName, detectorName);
    unlinkDetectorFromVis(dashboardName, visualizationName, detectorName);
  });

  it('Associate existing detector - creation flow', () => {
    openAddAnomalyDetectorFlyout(dashboardName, visualizationName);

    cy.get('.euiFlyout').find('.euiTitle').contains('Add anomaly detector');
    // ensuring the flyout is defaulting to detector creation vs. association
    cy.getElementByTestId('adAnywhereCreateDetectorButton');
    cy.get('[id="add-anomaly-detector__existing"]').click();

    associateDetectorFromVis(detectorName);

    ensureDetectorIsLinked(dashboardName, visualizationName, detectorName);
    unlinkDetectorFromVis(dashboardName, visualizationName, detectorName);
  });

  it('Associate existing detector - associated detectors flow', () => {
    openAssociatedDetectorsFlyout(dashboardName, visualizationName);
    cy.getElementByTestId('associateDetectorButton').click();
    associateDetectorFromVis(detectorName);

    ensureDetectorIsLinked(dashboardName, visualizationName, detectorName);
    unlinkDetectorFromVis(dashboardName, visualizationName, detectorName);
  });

  it.skip('View associated detector in table', () => {
    // TODO: add helper fns to view associated table
  });
});
