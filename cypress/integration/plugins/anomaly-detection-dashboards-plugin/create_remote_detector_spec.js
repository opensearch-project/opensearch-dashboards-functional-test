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
  const REMOTE_DATA_SOURCE_USERNAME = Cypress.env(
    'remoteDataSourceBasicAuthUsername'
  );
  const REMOTE_DATA_SOURCE_PASSWORD = Cypress.env('password');
  const isSecure = Cypress.env('SECURITY_ENABLED');
  const remoteBaseUrl = isSecure
    ? Cypress.env('remoteDataSourceBasicAuthUrl')
    : Cypress.env('remoteDataSourceNoAuthUrl');
  const auth = isSecure
    ? `-u ${REMOTE_DATA_SOURCE_USERNAME}:${REMOTE_DATA_SOURCE_PASSWORD}`
    : '';
  const insecureOption = isSecure ? '--insecure' : '';

  //Clean up created resources
  afterEach(() => {
    cy.deleteAllIndices();
    cy.deleteADSystemIndices();
  });

  describe('Remote cluster tests', () => {
    before(function () {
      cy.visit(AD_URL.OVERVIEW, { timeout: 10000 });
      cy.exec(
        `curl --silent --max-time 5 ${insecureOption} ${auth} ${remoteBaseUrl}/_cluster/health`,
        { failOnNonZeroExit: false }
      ).then((result) => {
        if (!result.stdout || !result.stdout.trim()) {
          Cypress.log({
            message: 'Remote cluster is unavailable — skipping tests',
          });
          this.skip();
        }
      });

      let remoteClusterName = 'opensearch';
      // make a cluster health call to get the remote cluster name
      cy.request('GET', `${remoteBaseUrl}/_cluster/health`).then((response) => {
        Cypress.log({
          message: `Cluster health response: ${JSON.stringify(response.body)}`,
        });
        cy.task(
          'log',
          `cluster health response: ${JSON.stringify(response.body)}`
        );

        cy.task('log', `remote url for cluster health call: ${remoteBaseUrl}`);

        cy.task(
          'log',
          `response.body.cluster_name: ${response.body.cluster_name}`
        );

        if (!response.body || !response.body.cluster_name) {
          Cypress.log({ message: 'Cluster name not found - skipping tests' });
          this.skip();
        }
        Cypress.env('remoteClusterName', response.body.cluster_name);
        remoteClusterName = response.body.cluster_name;
      });

      const remoteSettings = `${remoteBaseUrl}/_cluster/settings?include_defaults=true`;
      cy.task('log', `remoteClusterName1: ${remoteClusterName}`);
      // make a get cluster setting to the remote cluster
      cy.request({
        method: 'GET',
        url: remoteSettings,
      }).then((response) => {
        const remoteTransportPort = response.body.defaults.transport.port;

        Cypress.log({
          message: `transport port: ${remoteTransportPort}`,
        });

        cy.task('log', `remoteClusterName2: ${remoteClusterName}`);
        const remoteClusterSettings = {
          persistent: {
            [`cluster.remote.${remoteClusterName}`]: {
              seeds: [`127.0.0.1:${remoteTransportPort}`],
            },
          },
        };

        cy.task('log', `remoteTransportPort: ${remoteTransportPort}`);

        cy.request({
          method: 'PUT',
          url: `${BACKEND_BASE_PATH}/_cluster/settings`,
          headers: {
            'content-type': 'application/json',
          },
          body: remoteClusterSettings,
        }).then((putResponse) => {
          Cypress.log({ message: 'Cluster settings updated successfully' });
          expect(putResponse.status).to.eq(200);
          cy.request({
            method: 'GET',
            url: `${BACKEND_BASE_PATH}/_remote/info`,
            headers: {
              'content-type': 'application/json',
              'osd-xsrf': true,
            },
          }).then((remoteInfoResponse) => {
            cy.task(
              'log',
              `remoteInfoTwo: ${JSON.stringify(remoteInfoResponse.body)}`
            );
            Cypress.log({
              message: `Remote info response: ${JSON.stringify(
                remoteInfoResponse.body
              )}`,
            });
            const clusterNames = Object.keys(remoteInfoResponse.body);
            cy.task(
              'log',
              `remote info log: ${JSON.stringify(remoteInfoResponse.body)}`
            );

            expect(
              clusterNames.length,
              'at least one remote cluster exists'
            ).to.be.greaterThan(0);
          });
        });
      });
    });

    // Index some sample data in local and follower cluster (remote)
    beforeEach(() => {
      cy.visit(AD_URL.OVERVIEW, { timeout: 10000 });
      cy.deleteAllIndices();
      cy.deleteADSystemIndices();
      cy.wait(3000);
      const remoteEndpointTestData = `${remoteBaseUrl}/${TEST_INDEX_NAME}/_bulk`;
      const remoteEndpointTestDataTwo = `${remoteBaseUrl}/${TEST_SECOND_INDEX_NAME}/_bulk`;
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
          2000
        ).then((sampleRemoteDataResponse) => {
          cy.task(
            'log',
            `sampleRemoteDataResponse log: ${JSON.stringify(
              sampleRemoteDataResponse.body
            )}`
          );
          expect(sampleRemoteDataResponse.status).to.eq(200);
        });
      });
      cy.wait(1000);
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
          ).then((sampleRemoteDataTwoResponse) => {
            cy.task(
              'log',
              `sampleRemoteDataTwoResponse log: ${JSON.stringify(
                sampleRemoteDataTwoResponse.body
              )}`
            );

            expect(sampleRemoteDataTwoResponse.status).to.eq(200);
          });
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
        }).then((sampleDataResponse) => {
          cy.task(
            'log',
            `sampleDataResponse log: ${JSON.stringify(sampleDataResponse.body)}`
          );
          expect(sampleDataResponse.status).to.eq(200);
        });
      });
      cy.request({
        method: 'GET',
        url: `${BACKEND_BASE_PATH}/_resolve/index/*:*`,
        headers: {
          'content-type': 'application/json',
          'osd-xsrf': true,
        },
      }).then((resolveIndexResponse) => {
        cy.task(
          'log',
          `resolveIndexResponse: ${JSON.stringify(resolveIndexResponse.body)}`
        );
        expect(resolveIndexResponse.status).to.eq(200);
      });
    });

    it('Full creation - based on remote index', () => {
      // Define detector step
      const remoteClusterName = Cypress.env('remoteClusterName');

      cy.visit(AD_URL.CREATE_AD);
      cy.getElementByTestId('defineOrEditDetectorTitle').should('exist');
      cy.getElementByTestId('detectorNameTextInput').type(
        TEST_DETECTOR_REMOTE_NAME
      );
      cy.getElementByTestId('detectorDescriptionTextInput').type(
        TEST_DETECTOR_DESCRIPTION
      );

      cy.getElementByTestId('clustersFilter').click();
      cy.contains(
        '.euiComboBoxOption__content',
        `${remoteClusterName} (Remote)`
      ).click();

      cy.wait(500);

      cy.getElementByTestId('indicesFilter').type(TEST_INDEX_NAME);
      cy.wait(500);
      cy.contains(
        '.euiComboBoxOption__content',
        `${remoteClusterName}:${TEST_INDEX_NAME}`
      ).click();
      cy.wait(1500);

      selectTopItemFromFilter('timestampFilter', false);

      cy.getElementByTestId('defineDetectorNextButton').click();
      cy.wait(1500);
      cy.getElementByTestId('defineOrEditDetectorTitle').should('not.exist');
      cy.getElementByTestId('configureOrEditModelConfigurationTitle').should(
        'exist'
      );

      // Go back to create detector page to view that cluster selection didn't disappear
      cy.contains('span.euiButton__text', 'Previous').click({ force: true });
      cy.wait(1500);
      cy.getElementByTestId('clustersFilter').should(
        'contain',
        `${remoteClusterName} (Remote)`
      );

      cy.getElementByTestId('defineDetectorNextButton').click();
      cy.wait(1500);
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
      cy.getElementByTestId('indexNameCell').contains(
        `${remoteClusterName}:${TEST_INDEX_NAME}`
      );
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
      const remoteClusterName = Cypress.env('remoteClusterName');

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
        `${remoteClusterName} (Remote)`
      ).click();

      cy.wait(1000);

      cy.getElementByTestId('indicesFilter').click();
      cy.getElementByTestId('indicesFilter').type(TEST_INDEX_NAME);
      cy.wait(500);
      cy.get('.euiComboBoxOption__content').contains(TEST_INDEX_NAME).click();

      cy.getElementByTestId('indicesFilter').click();
      cy.wait(1000);

      cy.getElementByTestId('indicesFilter').type('sample-ad-index-t');
      cy.wait(1000);

      cy.get('.euiComboBoxOption__content')
        .contains(`${remoteClusterName}:${TEST_SECOND_INDEX_NAME}`)
        .should('exist')
        .click();

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
      cy.contains(`${remoteClusterName} (Remote)`).should('be.visible');

      cy.contains('(Local)').should('be.visible');
      cy.contains(TEST_INDEX_NAME).should('be.visible');

      cy.getElementByTestId('euiFlyoutCloseButton').click();
      cy.wait(500);

      cy.getElementByTestId('createDetectorButton').click();

      cy.wait(5500);

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
      cy.contains(`${remoteClusterName} (Remote)`).should('be.visible');
      cy.contains('(Local)').should('be.visible');
      cy.contains(TEST_INDEX_NAME).should('be.visible');
    });
  });
});
