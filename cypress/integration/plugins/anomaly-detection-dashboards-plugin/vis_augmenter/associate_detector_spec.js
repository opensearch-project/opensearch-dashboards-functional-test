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
  ensureDetectorDetails,
  openDetectorDetailsPageFromFlyout,
} from '../../../../utils/helpers';
import {
  INDEX_PATTERN_FILEPATH_SIMPLE,
  INDEX_SETTINGS_FILEPATH_SIMPLE,
  SAMPLE_DATA_FILEPATH_SIMPLE,
} from '../../../../utils/constants';

describe('Anomaly detection integration with vis augmenter', () => {
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

  it('Shows empty state when no associated detectors', () => {
    openAssociatedDetectorsFlyout(dashboardName, visualizationName);
    cy.getElementByTestId('emptyAssociatedDetectorFlyoutMessage');
  });

  it('Create new detector from visualization', () => {
    openAddAnomalyDetectorFlyout(dashboardName, visualizationName);
    createDetectorFromVis(detectorName);

    ensureDetectorIsLinked(dashboardName, visualizationName, detectorName);

    // Since this detector is created based off of vis metrics, we assume here
    // the number of features will equal the number of metrics we have specified.
    ensureDetectorDetails(detectorName, visualizationSpec.metrics.length);

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

  it('Deleting linked detector shows error once and removes from associated detectors list', () => {
    openAssociatedDetectorsFlyout(dashboardName, visualizationName);
    cy.getElementByTestId('associateDetectorButton').click();
    associateDetectorFromVis(detectorName);
    ensureDetectorIsLinked(dashboardName, visualizationName, detectorName);
    openDetectorDetailsPageFromFlyout();
    cy.getElementByTestId('configurationsTab').click();
    cy.getElementByTestId('detectorNameHeader').within(() => {
      cy.contains(detectorName);
    });

    cy.getElementByTestId('actionsButton').click();
    cy.getElementByTestId('deleteDetectorItem').click();
    cy.getElementByTestId('typeDeleteField').type('delete', { force: true });
    cy.getElementByTestId('confirmButton').click();
    cy.wait(5000);

    // TODO: reload dashboard and make sure the error shows up, and the associated detectors list is empty)
  });
});
