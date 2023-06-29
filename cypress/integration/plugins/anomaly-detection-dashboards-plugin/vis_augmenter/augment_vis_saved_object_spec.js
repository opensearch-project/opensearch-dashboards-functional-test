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
} from '../../../../utils/helpers';
import {
  INDEX_PATTERN_FILEPATH_SIMPLE,
  INDEX_SETTINGS_FILEPATH_SIMPLE,
  SAMPLE_DATA_FILEPATH_SIMPLE,
} from '../../../../utils/constants';

describe('AD augment-vis saved objects', () => {
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

    // TODO: navigate to saved obj management page and make sure it is there

    unlinkDetectorFromVis(dashboardName, visualizationName, detectorName);

    // TODO: navigate to saved obj management page and make sure it is gone
  });

  // TODO: other tests to add:
  // - unlinking detector will delete the saved obj
  // - delete the saved obj will remove the association
  // - ensure some details about the saved obj
  // - ensure saved obj count is as expected (0, 1, 2+)
});
