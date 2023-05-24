/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TABLE_INDEX_ID,
  TABLE_INDEX_PATTERN,
  TABLE_PATH_INDEX_DATA,
  TABLE_INDEX_START_TIME,
  TABLE_INDEX_END_TIME,
  TABLE_CREATE_URL,
  TABLE_VIS_APP_PATH,
  TABLE_VIS_TYPE,
} from '../../../../../utils/constants';

/**
 * Basic test suite description:
 * Create a new table visualization from index pattern.
 * Set the time range and Histogram Aggregation.
 * Test that global header and side bar function correctly.
 * Test that table visualization can be saved.
 * Test inspector is enabled and contains correct data.
 */

describe('table visualization basic functions', () => {
  before(() => {
    cy.deleteIndex(TABLE_INDEX_ID);
    cy.deleteIndexPattern(TABLE_INDEX_PATTERN);
    cy.bulkUploadDocs(TABLE_PATH_INDEX_DATA);
    cy.createIndexPattern(TABLE_INDEX_PATTERN, {
      title: TABLE_INDEX_ID,
      timeFieldName: 'timestamp',
    });

    cy.log('create a new table visualization: ', TABLE_CREATE_URL);
    cy.visit(TABLE_CREATE_URL);
    cy.url().should('contain', TABLE_VIS_APP_PATH);
    // Select index pattern and load table visualization
    cy.setTopNavDate(TABLE_INDEX_START_TIME, TABLE_INDEX_END_TIME);
    // Wait for page to load
    cy.waitForLoader();
  });

  it('Should apply changed params and allow to reset', () => {
    // Set a Histogram Aggregation
    cy.tbAddBucketsAggregation();
    cy.tbSplitRows();
    cy.tbSetupHistogramAggregation('age', '20', 2);
    // Update Historgram interval
    cy.tbSetHistogramInterval('201', 2);
    cy.tbIsUpdateAggregationSettingsEnabled();
    // Discard the updated interval
    cy.tbDiscardAggregationSettings();
    cy.tbIsHistogramIntervalSet('20', 2);
  });

  it('Should be able to save and load', () => {
    const cleanupKey = Date.now();
    const title = `table${cleanupKey}`;
    // Save
    cy.log('Save this table visualization with title ', title);
    cy.getElementByTestId('visualizeSaveButton')
      .should('not.be.disabled')
      .click();
    cy.getElementByTestId('savedObjectTitle').type(title);
    cy.getElementByTestId('confirmSaveSavedObjectButton').click();
    // Verify save
    cy.getElementByTestId('breadcrumb last')
      .invoke('attr', 'title')
      .should('equal', title);
    // Cleanup
    cy.log('Remove saved table visualization with title ', title);
    cy.deleteSavedObjectByType(TABLE_VIS_TYPE, title);
  });

  it('Should have inspector enabled', () => {
    cy.getElementByTestId('openInspectorButton')
      .invoke('attr', 'class')
      .should(
        'equal',
        'euiButtonEmpty euiButtonEmpty--primary euiButtonEmpty--xSmall euiHeaderLink'
      );
  });

  it('Should show correct data in inspector', () => {
    const expectedData = [
      '0',
      '1,059',
      '20',
      '2,236',
      '40',
      '2,200',
      '60',
      '2,211',
      '80',
      '2,179',
      '100',
      '115',
    ];
    cy.tbOpenInspector();
    cy.tbGetTableDataFromInspectPanel().then((data) => {
      expect(data).to.deep.eq(expectedData);
    });
    cy.tbCloseInspector();
  });

  after(() => {
    cy.deleteIndex(TABLE_INDEX_ID);
    cy.deleteIndexPattern(TABLE_INDEX_PATTERN);
  });
});
