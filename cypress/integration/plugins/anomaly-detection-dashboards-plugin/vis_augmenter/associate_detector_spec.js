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
  const detectorName = 'sample-http-responses-detector';
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
    cy.getElementByTestId('adAnywhereCreateDetectorButton').click();
    cy.wait(5000);
    openAssociatedDetectorsFlyout(dashboardName, visualizationName);

    // since anomaly detectors default to including the visualization name in the
    // created detector name, we can filter search by this to ensure it exists
    cy.get('.euiFieldSearch').type(visualizationName);
    cy.get('.euiBasicTable').find('.euiTableRow').should('have.length', 1);

    cy.getElementByTestId('unlinkButton').click();
    cy.getElementByTestId('confirmUnlinkButton').click();
  });

  it('Associate existing detector - creation flow', () => {
    // createSampleDetector('createHttpSampleDetectorButton');
    openAddAnomalyDetectorFlyout(dashboardName, visualizationName);

    cy.get('.euiFlyout').find('.euiTitle').contains('Add anomaly detector');
    // ensuring the flyout is defaulting to detector creation vs. association
    cy.getElementByTestId('adAnywhereCreateDetectorButton');
    cy.get('[id="add-anomaly-detector__existing"]').click();
    cy.wait(2000);
    cy.getElementByTestId('comboBoxInput').type(`{downArrow}{enter}`);
    cy.wait(2000);
    cy.getElementByTestId('adAnywhereAssociateDetectorButton').click();
    cy.wait(5000);

    openAssociatedDetectorsFlyout(dashboardName, visualizationName);

    cy.get('.euiBasicTable').find('.euiTableRow').should('have.length', 1);
    cy.getElementByTestId('unlinkButton').click();
    cy.getElementByTestId('confirmUnlinkButton').click();

    openAssociatedDetectorsFlyout(dashboardName, visualizationName);
    cy.getElementByTestId('emptyAssociatedDetectorFlyoutMessage');
  });

  it('Associate existing detector - associated detectors flow', () => {
    openAssociatedDetectorsFlyout(dashboardName, visualizationName);

    cy.getElementByTestId('associateDetectorButton').click();
    cy.wait(2000);
    cy.getElementByTestId('comboBoxInput').type(`{downArrow}{enter}`);
    cy.wait(2000);
    cy.getElementByTestId('adAnywhereAssociateDetectorButton').click();
    cy.wait(5000);

    openAssociatedDetectorsFlyout(dashboardName, visualizationName);
    cy.get('.euiBasicTable').find('.euiTableRow').should('have.length', 1);

    cy.getElementByTestId('unlinkButton').click();
    cy.getElementByTestId('confirmUnlinkButton').click();

    openAssociatedDetectorsFlyout(dashboardName, visualizationName);
    cy.getElementByTestId('emptyAssociatedDetectorFlyoutMessage');
  });

  it.skip('View associated detector in table', () => {
    // TODO: add helper fns to view associated table
  });
});
