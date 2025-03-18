/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AD_FIXTURE_BASE_PATH,
  AD_URL,
  BACKEND_BASE_PATH,
} from '../../../utils/constants';
import { selectTopItemFromFilter } from '../../../utils/helpers';

context('Create remote detector workflow', () => {
  const TEST_DETECTOR_REMOTE_NAME = 'test-detector-remote';
  const TEST_DETECTOR_DESCRIPTION = 'Some test detector description.';
  const TEST_FEATURE_NAME = 'test-feature';
  const TEST_TIMESTAMP_NAME = 'timestamp'; // coming from single_index_response.json fixture
  const TEST_INDEX_NAME = 'sample-ad-index';
  const TEST_SECOND_INDEX_NAME = 'sample-ad-index-two';
  const TEST_REMOTE_INDEX = 'followCluster:sample-ad-index';
  const remoteClusterSettings = {
    persistent: {
      'cluster.remote.followCluster': {
        seeds: ['127.0.0.1:9301'],
      },
    },
  };

  // Clean up created resources
  afterEach(() => {
    cy.deleteAllIndices();
    cy.deleteADSystemIndices();
  });

  describe('Remote cluster tests', () => {
    before(function () {
      cy.visit(AD_URL.OVERVIEW, { timeout: 10000 });
      // Use `cy.exec()` to check cluster health before running tests
      cy.exec(
        `
            node -e "
            require('http')
              .get('${Cypress.env(
                'remoteDataSourceNoAuthUrl'
              )}/_cluster/health', res => process.exit(res.statusCode === 200 ? 0 : 1))
              .on('error', () => process.exit(1));
            "`,
        { failOnNonZeroExit: false }
      ).then((result) => {
        if (result.code !== 0) {
          Cypress.log({
            name: 'Cluster Health',
            message:
              'Remote cluster is unavailable - skipping all remote detector tests',
          });
          this.skip(); // Skip the entire test suite
        }
      });
    });

    // apply remote cluster settings after cluster health check passes
    before(function () {
      cy.visit(AD_URL.OVERVIEW, { timeout: 10000 });
      cy.request({
        method: 'PUT',
        url: `${BACKEND_BASE_PATH}/_cluster/settings`,
        headers: {
          'content-type': 'application/json',
          'osd-xsrf': true, // If your backend requires this header
        },
        body: remoteClusterSettings,
      }).then((response) => {
        cy.log('Cluster settings update response:', response);
        expect(response.status).to.eq(200);
      });
      cy.wait(5000);
    });

    // Index some sample data in follower cluster (remote)
    beforeEach(() => {
      cy.visit(AD_URL.OVERVIEW, { timeout: 10000 });
      const remoteEndpointTestData = `${Cypress.env(
        'remoteDataSourceNoAuthUrl'
      )}/${TEST_INDEX_NAME}/_bulk`;
      const remoteEndpointTestDataTwo = `${Cypress.env(
        'remoteDataSourceNoAuthUrl'
      )}/${TEST_SECOND_INDEX_NAME}/_bulk`;

      cy.fixture(AD_FIXTURE_BASE_PATH + 'sample_test_data.txt').then((data) => {
        cy.request(
          {
            method: 'POST',
            form: false,
            url: remoteEndpointTestData,
            headers: {
              'content-type': 'application/json;charset=UTF-8',
              'osd-xsrf': true,
            },
            body: data,
          },
          1000
        );
      });
      cy.fixture(AD_FIXTURE_BASE_PATH + 'sample_remote_test_data.txt').then(
        (data) => {
          cy.request(
            {
              method: 'POST',
              form: false,
              url: remoteEndpointTestDataTwo,
              headers: {
                'content-type': 'application/json;charset=UTF-8',
                'osd-xsrf': true,
              },
              body: data,
            },
            1000
          );
        }
      );
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

    it('Full creation - based on remote index', () => {
      // Define detector step
      cy.visit(AD_URL.CREATE_AD);
      cy.getElementByTestId('defineOrEditDetectorTitle').should('exist');
      cy.getElementByTestId('detectorNameTextInput').type(
        TEST_DETECTOR_REMOTE_NAME
      );
      cy.getElementByTestId('detectorDescriptionTextInput').type(
        TEST_DETECTOR_DESCRIPTION
      );

      cy.getElementByTestId('clustersFilter').click();
      cy.getElementByTestId('clustersFilter').click();
      cy.contains(
        '.euiComboBoxOption__content',
        'followCluster (Remote)'
      ).click();

      cy.wait(3000);

      cy.getElementByTestId('indicesFilter').click();
      cy.wait(1000);
      cy.contains(
        '.euiComboBoxOption__content',
        'followCluster:sample-ad-index'
      ).click();

      selectTopItemFromFilter('timestampFilter', false);

      cy.getElementByTestId('defineDetectorNextButton').click();
      // cy.wait(5000);
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
      cy.getElementByTestId('detectorNameCell').contains(
        TEST_DETECTOR_REMOTE_NAME
      );
      cy.getElementByTestId('detectorDescriptionCell').contains(
        TEST_DETECTOR_DESCRIPTION
      );
      cy.getElementByTestId('indexNameCell').contains(TEST_REMOTE_INDEX);
      cy.getElementByTestId('timestampNameCell').contains(TEST_TIMESTAMP_NAME);
      cy.getElementByTestId('featureTable').contains(TEST_FEATURE_NAME);

      cy.getElementByTestId('createDetectorButton').click();

      cy.wait(5000);

      // Lands on the config page by default.
      cy.getElementByTestId('detectorSettingsHeader').should('exist');
      cy.getElementByTestId('modelConfigurationHeader').should('exist');
      cy.getElementByTestId('detectorJobsHeader').should('exist');
    });

    it('Full creation - based on multiple indexes', () => {
      // Define detector step
      cy.visit(AD_URL.CREATE_AD);
      cy.getElementByTestId('defineOrEditDetectorTitle').should('exist');
      cy.getElementByTestId('detectorNameTextInput').type(
        TEST_DETECTOR_REMOTE_NAME
      );
      cy.getElementByTestId('detectorDescriptionTextInput').type(
        TEST_DETECTOR_DESCRIPTION
      );

      cy.getElementByTestId('clustersFilter').click();
      cy.getElementByTestId('clustersFilter').click();
      cy.contains(
        '.euiComboBoxOption__content',
        'followCluster (Remote)'
      ).click();

      cy.wait(3000);

      cy.getElementByTestId('indicesFilter').click();
      cy.wait(1000);
      cy.contains(
        '.euiComboBoxOption__content',
        'followCluster:sample-ad-index'
      ).click();
      cy.contains('.euiComboBoxOption__content', 'sample-ad-index').click();
      cy.contains(
        '.euiComboBoxOption__content',
        'followCluster:sample-ad-index-two'
      ).click();

      selectTopItemFromFilter('timestampFilter', false);

      cy.getElementByTestId('defineDetectorNextButton').click();
      cy.getElementByTestId('defineOrEditDetectorTitle').should('not.exist');
      cy.getElementByTestId('configureOrEditModelConfigurationTitle').should(
        'exist'
      );

      // Configure model step
      cy.getElementByTestId('featureNameTextInput-0').type(TEST_FEATURE_NAME);

      // check fields from both indices are present
      cy.getElementByTestId('featureFieldTextInput-0').click();
      cy.wait(500);
      cy.get('.euiComboBoxOption__content')
        .contains('secondVal')
        .should('be.visible');
      cy.get('.euiComboBoxOption__content')
        .contains('value')
        .should('be.visible');
      cy.get('.euiComboBoxOption__content')
        .contains('value')
        .should('exist')
        .click({ force: true });

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
      cy.getElementByTestId('detectorNameCell').contains(
        TEST_DETECTOR_REMOTE_NAME
      );
      cy.getElementByTestId('detectorDescriptionCell').contains(
        TEST_DETECTOR_DESCRIPTION
      );
      cy.getElementByTestId('indexNameCell').contains(TEST_INDEX_NAME);
      cy.getElementByTestId('timestampNameCell').contains(TEST_TIMESTAMP_NAME);
      cy.getElementByTestId('featureTable').contains(TEST_FEATURE_NAME);

      // verify "Data connection" is visible
      cy.getElementByTestId('indexNameCellViewAllLink').contains('View all');
      cy.getElementByTestId('indexNameCellViewAllLink')
        .contains('View all')
        .click({ force: true });

      cy.wait(500);

      cy.contains('span.euiTableCellContent__text', 'Data connection').should(
        'be.visible'
      );
      cy.contains('followCluster (Remote)').should('be.visible');
      cy.contains('leaderCluster (Local)').should('be.visible');
      cy.contains('sample-ad-index').should('be.visible');

      cy.getElementByTestId('euiFlyoutCloseButton').click();
      cy.wait(500);

      cy.getElementByTestId('createDetectorButton').click();

      cy.wait(3500);

      // Lands on the config page by default.
      cy.getElementByTestId('detectorSettingsHeader').should('exist');
      cy.getElementByTestId('modelConfigurationHeader').should('exist');
      cy.getElementByTestId('detectorJobsHeader').should('exist');

      cy.getElementByTestId('indexNameCellViewAllLink').contains('View all');

      // verify "Data connection" is visible on config page
      cy.getElementByTestId('indexNameCellViewAllLink').contains('View all');
      cy.getElementByTestId('indexNameCellViewAllLink')
        .contains('View all')
        .click({ force: true });

      cy.wait(500);

      cy.contains('span.euiTableCellContent__text', 'Data connection').should(
        'be.visible'
      );
      cy.contains('followCluster (Remote)').should('be.visible');
      cy.contains('leaderCluster (Local)').should('be.visible');
      cy.contains('sample-ad-index').should('be.visible');
    });
  });
});
