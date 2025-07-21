/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AD_FIXTURE_BASE_PATH,
  BACKEND_BASE_PATH,
  FORECAST_URL,
} from '../../../utils/constants';

const TEST_FORECASTER_REMOTE_NAME = 'test-forecaster-remote';
const TEST_INDEX_NAME = 'sample-daily-forecaster-index';
const REMOTE_TEST_INDEX_NAME = 'sample-remote-daily-forecaster-index';
const TEST_TIMESTAMP_FIELD = 'timestamp';
const TEST_VALUE_FIELD = 'value';
const TEST_HOST_FIELD = 'host';

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

const setAbsoluteStartDate = (startDate) => {
  cy.getElementByTestId('superDatePickerShowDatesButton').click();
  cy.getElementByTestId('superDatePickerAbsoluteTab').first().click();
  cy.getElementByTestId('superDatePickerAbsoluteDateInput')
    .first()
    .clear()
    .type(startDate);
  cy.getElementByTestId('superDatePickerApplyTimeButton').click();
  cy.contains('Loading forecast results...', { timeout: 180000 }).should(
    'not.exist'
  );
};

context('Create remote forecaster workflow', () => {
  // Clean up created resources
  afterEach(() => {
    cy.deleteAllIndices();
    cy.deleteForecastIndices();
  });

  describe('Remote cluster tests', () => {
    before(function () {
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
      cy.request('GET', `${remoteBaseUrl}/_cluster/health`).then((response) => {
        Cypress.log({
          message: `Cluster health response: ${JSON.stringify(response.body)}`,
        });
        if (!response.body || !response.body.cluster_name) {
          Cypress.log({ message: 'Cluster name not found - skipping tests' });
          this.skip();
        }
        Cypress.env('remoteClusterName', response.body.cluster_name);
        remoteClusterName = response.body.cluster_name;
      });

      const remoteSettingsUrl = `${remoteBaseUrl}/_cluster/settings?include_defaults=true`;
      cy.request({
        method: 'GET',
        url: remoteSettingsUrl,
      }).then((response) => {
        const remoteTransportPort = response.body.defaults.transport.port;
        Cypress.log({ message: `transport port: ${remoteTransportPort}` });
        const remoteClusterSettings = {
          persistent: {
            [`cluster.remote.${remoteClusterName}`]: {
              seeds: [`127.0.0.1:${remoteTransportPort}`],
            },
          },
        };

        cy.request({
          method: 'PUT',
          url: `${BACKEND_BASE_PATH}/_cluster/settings`,
          headers: { 'content-type': 'application/json' },
          body: remoteClusterSettings,
        }).then((putResponse) => {
          expect(putResponse.status).to.eq(200);
          cy.request({
            method: 'GET',
            url: `${BACKEND_BASE_PATH}/_remote/info`,
            headers: { 'content-type': 'application/json', 'osd-xsrf': true },
          }).then((remoteInfoResponse) => {
            const clusterNames = Object.keys(remoteInfoResponse.body);
            expect(clusterNames.length).to.be.greaterThan(0);
          });
        });
      });
    });

    beforeEach(() => {
      cy.deleteAllIndices();
      cy.deleteForecastIndices();
      cy.deleteAllRemoteIndices();
      cy.wait(3000);

      // Create index with mapping
      cy.request({
        method: 'POST',
        url: 'api/console/proxy',
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          'osd-xsrf': true,
        },
        qs: {
          path: `${TEST_INDEX_NAME}`,
          method: 'PUT',
        },
        body: {
          settings: {
            number_of_shards: 1,
            auto_expand_replicas: '0-1',
          },
          mappings: {
            properties: {
              [TEST_TIMESTAMP_FIELD]: {
                type: 'date',
                format: 'yyyy-MM-dd HH:mm:ss',
              },
              [TEST_VALUE_FIELD]: { type: 'float' },
              [TEST_HOST_FIELD]: { type: 'keyword' },
            },
          },
        },
      });

      // Load test data
      cy.fixture(AD_FIXTURE_BASE_PATH + 'daily_interval.ndjson').then(
        (data) => {
          cy.request({
            method: 'POST',
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
        }
      );

      // Create index with mapping on remote cluster
      cy.request({
        method: 'PUT',
        url: `${remoteBaseUrl}/${REMOTE_TEST_INDEX_NAME}`,
        body: {
          settings: { number_of_shards: 1, auto_expand_replicas: '0-1' },
          mappings: {
            properties: {
              [TEST_TIMESTAMP_FIELD]: {
                type: 'date',
                format: 'yyyy-MM-dd HH:mm:ss',
              },
              [TEST_VALUE_FIELD]: { type: 'float' },
              [TEST_HOST_FIELD]: { type: 'keyword' },
            },
          },
        },
      });

      // Load test data to remote cluster
      cy.fixture(AD_FIXTURE_BASE_PATH + 'daily_interval.ndjson').then(
        (data) => {
          cy.request({
            method: 'POST',
            url: `${remoteBaseUrl}/${REMOTE_TEST_INDEX_NAME}/_bulk`,
            headers: { 'content-type': 'application/json;charset=UTF-8' },
            body: data,
          }).then((response) => {
            expect(response.status).to.eq(200);
          });
        }
      );
    });

    it('Full creation - based on remote index', () => {
      const remoteClusterName = Cypress.env('remoteClusterName');

      // Define forecaster step
      cy.visit(FORECAST_URL.CREATE_FORECASTER);
      cy.getElementByTestId('defineOrEditForecasterTitle').should('exist');
      cy.getElementByTestId('forecasterNameTextInput').type(
        `${TEST_FORECASTER_REMOTE_NAME}{enter}`
      );

      cy.getElementByTestId('clustersFilter').click();
      cy.contains(
        '.euiComboBoxOption__content',
        `${remoteClusterName} (Cross cluster connection)`
      ).click();

      cy.getElementByTestId('indicesFilter').type(`${TEST_INDEX_NAME}{enter}`);
      // avoid "element is detached from the DOM" error due to clicking before UI re-render
      cy.wait(500);
      cy.contains(
        '.euiComboBoxOption__content',
        `${remoteClusterName}:${REMOTE_TEST_INDEX_NAME}`
      ).click({ force: true });
      cy.wait(1500);

      cy.getElementByTestId('timestampFilter').type(
        `${TEST_TIMESTAMP_FIELD}{enter}`
      );
      cy.getElementByTestId('featureNameTextInput-0').type(TEST_VALUE_FIELD);
      cy.getElementByTestId('featureFieldTextInput-0').type(
        `${TEST_VALUE_FIELD}{enter}`
      );

      cy.getElementByTestId('defineForecasterNextButton').click();
      cy.getElementByTestId('defineOrEditForecasterTitle').should('not.exist');
      cy.getElementByTestId('configureOrEditModelConfigurationTitle').should(
        'exist'
      );

      // Configure model step
      cy.getElementByTestId('suggestParametersButton').click();
      cy.getElementByTestId('generateSuggestionsButton').click();
      cy.getElementByTestId('useSuggestedParametersButton').click();
      cy.getElementByTestId('suggestParametersDialogTitle').should('not.exist');

      // For version 3.1, if the interval suggestion fails and shows a warning,
      // we need to manually provide a valid interval to proceed.
      // 3.1 does not support daily interval and thus suggest API would fail for daily interval data.
      cy.request({
        method: 'GET',
        url: `${Cypress.env('openSearchUrl')}/`,
      }).then((response) => {
        const fullVersion = response.body.version.number;
        const versionParts = fullVersion.split('.').map(Number);
        const major = versionParts[0] || 0;
        const minor = versionParts[1] || 0;
        const majorMinorVersion = `${major}.${minor}`;

        if (major === 3 && minor === 1) {
          cy.task('log', 'Version is 3.1, manually setting interval.');
          // Verify that the interval input field exists on the page.
          cy.get('input[name="interval"]').should('exist');

          cy.get('input[name="interval"]').clear().type('1440');
        } else {
          cy.task('log', `Version is ${majorMinorVersion} (not 3.1)`);
        }
      });

      cy.getElementByTestId('createForecasterButton').click();
      // a selector that tells Cypress to look specifically for a top-level heading element (<h2>)
      // that contains the forecaster's name.
      cy.contains('h2', TEST_FORECASTER_REMOTE_NAME).should('be.visible');

      cy.contains('button', 'Show latest').should('be.visible');

      // Start the forecaster
      cy.getElementByTestId('startCancelForecastButton').click();

      cy.contains('Stop forecasting', { timeout: 180000 }).should('be.visible');

      // Wait for forecaster to start
      cy.contains('Running', { timeout: 180000 }).should('be.visible');
      cy.contains('The forecast is initializing', { timeout: 180000 }).should(
        'not.exist'
      );

      // Check chart
      setAbsoluteStartDate('2020-01-01 00:00:00');
      // Verify that the chart canvas is rendered, indicating the chart is plotted.
      cy.get('canvas.echCanvasRenderer').should('be.visible');

      // Verify that the confidence band is rendered by checking the chart's accessibility description.
      // The text is for screen readers and is not visible, so we check for existence.
      cy.get('.echScreenReaderOnly')
        .contains('dd', /area and line chart/i)
        .should('exist');
    });
  });
});
