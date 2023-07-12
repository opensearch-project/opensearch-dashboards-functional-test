/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommonUI } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import {
  deleteVisAugmenterData,
  bootstrapDashboard,
  openAddAnomalyDetectorFlyout,
  createDetectorFromVis,
  unlinkDetectorFromVis,
  ensureDetectorIsLinked,
  filterByObjectType,
} from '../../../../utils/helpers';
import {
  INDEX_PATTERN_FILEPATH_SIMPLE,
  INDEX_SETTINGS_FILEPATH_SIMPLE,
  SAMPLE_DATA_FILEPATH_SIMPLE,
} from '../../../../utils/constants';

describe('AD augment-vis saved objects', () => {
  const commonUI = new CommonUI(cy);
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

  it('Associating a detector creates a visible saved object', () => {
    openAddAnomalyDetectorFlyout(dashboardName, visualizationName);
    createDetectorFromVis(detectorName);
    ensureDetectorIsLinked(dashboardName, visualizationName, detectorName);

    cy.visitSavedObjectsManagement();
    filterByObjectType('augment-vis');
    cy.getElementByTestId('savedObjectsTable')
      .find('.euiTableRow')
      .should('have.length', 1);
  });

  it('Created AD saved object has correct fields', () => {
    cy.visitSavedObjectsManagement();
    filterByObjectType('augment-vis');
    cy.getElementByTestId('savedObjectsTableAction-inspect').click();
    cy.contains('originPlugin');
    commonUI.checkElementExists('[value="anomalyDetectionDashboards"]', 1);
    cy.contains('pluginResource.type');
    commonUI.checkElementExists('[value="Anomaly Detectors"]', 1);
    cy.contains('pluginResource.id');
    cy.contains('visLayerExpressionFn.type');
    commonUI.checkElementExists('[value="PointInTimeEvents"]', 1);
    cy.contains('visLayerExpressionFn.name');
    commonUI.checkElementExists('[value="overlay_anomalies"]', 1);
  });

  it('Removing an association deletes the saved object', () => {
    unlinkDetectorFromVis(dashboardName, visualizationName, detectorName);

    cy.visitSavedObjectsManagement();
    filterByObjectType('augment-vis');
    cy.getElementByTestId('savedObjectsTable')
      .find('.euiTableRow')
      .contains('No items found');
  });
});
