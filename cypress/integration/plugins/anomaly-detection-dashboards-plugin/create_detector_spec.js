/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AD_FIXTURE_BASE_PATH, AD_URL } from '../../../utils/constants';
import { selectTopItemFromFilter } from '../../../utils/helpers';

context('Create detector workflow', () => {
  const TEST_DETECTOR_NAME = 'test-detector';
  const TEST_DETECTOR_DESCRIPTION = 'Some test detector description.';
  const TEST_FEATURE_NAME = 'test-feature';
  const TEST_TIMESTAMP_NAME = 'timestamp'; // coming from single_index_response.json fixture
  const TEST_INDEX_NAME = 'sample-ad-index';

  // Index some sample data first
  beforeEach(() => {
    cy.deleteAllIndices();
    cy.deleteADSystemIndices();
    cy.fixture(AD_FIXTURE_BASE_PATH + 'sample_test_data.txt').then((data) => {
      cy.request({
        method: 'POST',
        form: false,
        url: 'api/console/proxy',
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          'osd-xsrf': true,
        },
        qs: {
          path: `${TEST_INDEX_NAME}/_bulk`,
          method: 'POST',
        },
        body: data,
      });
    });
  });

  // Clean up created resources
  afterEach(() => {
    cy.deleteAllIndices();
    cy.deleteADSystemIndices();
  });

  it('Full creation - based on real index', () => {
    // Define detector step
    cy.visit(AD_URL.CREATE_AD);
    cy.getElementByTestId('defineOrEditDetectorTitle').should('exist');
    cy.getElementByTestId('detectorNameTextInput').type(TEST_DETECTOR_NAME);
    cy.getElementByTestId('detectorDescriptionTextInput').type(
      TEST_DETECTOR_DESCRIPTION
    );
    cy.getElementByTestId('indicesFilter').type(`${TEST_INDEX_NAME}{enter}`);
    selectTopItemFromFilter('timestampFilter', false);

    cy.getElementByTestId('defineDetectorNextButton').click();
    cy.getElementByTestId('defineOrEditDetectorTitle').should('not.exist');
    cy.getElementByTestId('configureOrEditModelConfigurationTitle').should(
      'exist'
    );

    // Configure model step
    cy.getElementByTestId('featureNameTextInput-0').type(TEST_FEATURE_NAME);
    selectTopItemFromFilter('featureFieldTextInput-0', false);
    cy.getElementByTestId('configureModelNextButton').click();
    cy.getElementByTestId('configureOrEditModelConfigurationTitle').should(
      'not.exist'
    );
    cy.getElementByTestId('detectorJobsTitle').should('exist');

    // Set up detector jobs step
    cy.getElementByTestId('detectorJobsNextButton').click();
    cy.getElementByTestId('detectorJobsTitle').should('not.exist');
    cy.getElementByTestId('reviewAndCreateTitle').should('exist');

    // Review and create step
    cy.getElementByTestId('detectorNameCell').contains(TEST_DETECTOR_NAME);
    cy.getElementByTestId('detectorDescriptionCell').contains(
      TEST_DETECTOR_DESCRIPTION
    );
    cy.getElementByTestId('indexNameCell').contains(TEST_INDEX_NAME);
    cy.getElementByTestId('timestampNameCell').contains(TEST_TIMESTAMP_NAME);
    cy.getElementByTestId('featureTable').contains(TEST_FEATURE_NAME);
    cy.getElementByTestId('createDetectorButton').click();

    // Wait 5s for the detector to be created and started. By default,
    // real-time detection will start.
    cy.wait(5000);

    // Lands on the config page by default.
    cy.getElementByTestId('detectorSettingsHeader').should('exist');
    cy.getElementByTestId('modelConfigurationHeader').should('exist');
    cy.getElementByTestId('detectorJobsHeader').should('exist');
  });
});
