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
  filterByObjectType,
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

    cy.visitSavedObjectsManagement();
    filterByObjectType('augment-vis');
    cy.getElementByTestId('savedObjectsTable')
      .find('.euiTableRow')
      .should('have.length', 1);
  });

  it('Created AD saved object has correct fields', () => {
    cy.visitSavedObjectsManagement();
    filterByObjectType('augment-vis');
    // TODO: check some of the fields, specifically that AD-specific values
    // are there
  });

  it('Removing an associated deletes the saved object', () => {
    unlinkDetectorFromVis(dashboardName, visualizationName, detectorName);

    cy.visitSavedObjectsManagement();
    filterByObjectType('augment-vis');
    cy.getElementByTestId('savedObjectsTable')
      .find('.euiTableRow')
      .contains('No items found');
  });

  it('Deleting the visualization from the edit view deletes the saved object', () => {
    cy.visitSavedObjectsManagement();
    filterByObjectType('visualization');
    cy.getElementByTestId('savedObjectsTableAction-inspect').click();
    cy.getElementByTestId('savedObjectEditDelete').click();
    cy.getElementByTestId('confirmModalConfirmButton').click();
    cy.wait(3000);

    filterByObjectType('augment-vis');
    cy.getElementByTestId('savedObjectsTable')
      .find('.euiTableRow')
      .contains('No items found');
  });

  // TODO: other tests to add:
  // - ensure some details about the saved obj
  // - view events test suite. at least test the resource names show up to start
  // - view events check: make sure action doesn't exist if there is no resources/vislayers present
});
