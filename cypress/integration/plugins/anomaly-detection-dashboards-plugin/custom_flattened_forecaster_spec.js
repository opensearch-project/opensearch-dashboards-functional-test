/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AD_FIXTURE_BASE_PATH, FORECAST_URL } from '../../../utils/constants';

context('Forecaster with custom flattened result index', () => {
  const TEST_FORECASTER_NAME = 'test-custom-flattened-forecaster';
  const TEST_TIMESTAMP_FIELD = 'timestamp';
  const TEST_FIELD_TO_FORECAST = 'value';
  const TEST_INDEX_NAME = 'sample-custom-forecast-index';
  const CUSTOM_RESULT_INDEX_NAME = 'abc';
  const FLATTENED_INDEX_ALIAS_PREFIX = `opensearch-forecast-result-${CUSTOM_RESULT_INDEX_NAME}_flattened_${TEST_FORECASTER_NAME}`;

  // Setup test data similar to top_forecaster_spec
  beforeEach(() => {
    // without initial page load, the test can fail with "RequestError: Error: connect ECONNREFUSED 127.0.0.1:5601"
    // in later setup during a `before each` hook
    cy.visit(FORECAST_URL.CREATE_FORECASTER, { timeout: 10000 });

    cy.deleteAllIndices();
    cy.deleteForecastIndices();

    // Create index mapping
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
        mappings: {
          properties: {
            value: { type: 'float' },
            timestamp: { type: 'date', format: 'yyyy-MM-dd HH:mm:ss' },
            host: { type: 'keyword' },
          },
        },
      },
    });

    // Insert test data
    cy.fixture(AD_FIXTURE_BASE_PATH + 'sample_forecast_test_data.txt').then(
      (data) => {
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
      }
    );
  });

  afterEach(() => {
    cy.deleteAllIndices();
    cy.deleteForecastIndices();
  });

  it('should create and verify a forecaster with a custom flattened index', () => {
    // Step: Create forecaster (initial steps)
    cy.visit(FORECAST_URL.CREATE_FORECASTER);
    cy.getElementByTestId('defineOrEditForecasterTitle').should('exist');
    cy.getElementByTestId('forecasterNameTextInput').type(TEST_FORECASTER_NAME);
    cy.getElementByTestId('indicesFilter').type(`${TEST_INDEX_NAME}{enter}`);
    cy.getElementByTestId('timestampFilter').type(
      `${TEST_TIMESTAMP_FIELD}{enter}`
    );
    cy.getElementByTestId('featureNameTextInput-0').type(
      TEST_FIELD_TO_FORECAST
    );
    cy.getElementByTestId('featureFieldTextInput-0').type(
      `${TEST_FIELD_TO_FORECAST}{enter}`
    );
    cy.getElementByTestId('defineForecasterNextButton').click();
    cy.getElementByTestId('configureOrEditModelConfigurationTitle').should(
      'exist'
    );

    cy.getElementByTestId('suggestParametersButton').click();
    cy.getElementByTestId('suggestParametersDialogTitle').should('exist');
    cy.getElementByTestId('generateSuggestionsButton').click();
    cy.getElementByTestId('suggestedParametersResult').should('exist');

    cy.getElementByTestId('useSuggestedParametersButton').click();

    // The dialog should close and we're back on the model configuration page
    cy.getElementByTestId('suggestParametersDialogTitle').should('not.exist');

    // Step: Configure custom result index
    cy.contains('label', 'Custom index').click();
    cy.get('[placeholder="Enter result index name"]')
      .clear()
      .type(CUSTOM_RESULT_INDEX_NAME);
    cy.contains('label', 'Enable flattened custom result index').click();
    cy.getElementByTestId('resultIndexMinAge').clear().type('8');
    cy.getElementByTestId('resultIndexMinSize').clear().type('51300');
    cy.getElementByTestId('resultIndexTtl').clear().type('59');
    cy.getElementByTestId('createForecasterButton').click();

    // Step: Start forecasting and verify results are shown
    cy.contains('h2', TEST_FORECASTER_NAME).should('be.visible');
    cy.getElementByTestId('startCancelForecastButton').click();
    cy.contains('Stop forecasting', { timeout: 180000 }).should('be.visible');
    cy.contains('Running', { timeout: 180000 }).should('be.visible');
    cy.contains('The forecast is initializing', { timeout: 180000 }).should(
      'not.exist'
    );

    // If the forecast chart canvas isn't visible, it may be because the forecast
    // results are not yet available. This block implements a polling mechanism
    // to check the result index with retries.
    cy.get('body').then(($body) => {
      if ($body.find('canvas.echCanvasRenderer').length === 0) {
        cy.task(
          'log',
          'Canvas not found. Polling forecast result index for data...'
        );

        const aggregationQuery = {
          size: 0,
          query: {
            match_all: {},
          },
          aggregations: {
            max_timefield: {
              max: {
                field: 'data_end_time',
              },
            },
            min_timefield: {
              min: {
                field: 'data_end_time',
              },
            },
          },
        };

        const checkResults = (retriesLeft) => {
          if (retriesLeft <= 0) {
            cy.task('log', 'Max retries reached. No forecast results found.');
            return;
          }

          cy.task(
            'log',
            `Checking for forecast results. Retries left: ${retriesLeft}`
          );

          cy.request({
            method: 'POST', // Use POST to call the proxy endpoint
            url: 'api/console/proxy',
            headers: {
              'content-type': 'application/json;charset=UTF-8',
              'osd-xsrf': true,
            },
            qs: {
              path: '_cat/indices?format=json',
              method: 'GET', // The actual method for OpenSearch
            },
            failOnStatusCode: false,
          }).then((indicesResponse) => {
            cy.task('log', '--- cat/indices output ---');
            cy.task('log', JSON.stringify(indicesResponse.body, null, 2));
            cy.task('log', '--- end cat/indices output ---');

            cy.request({
              method: 'POST',
              url: 'api/console/proxy',
              headers: {
                'content-type': 'application/json;charset=UTF-8',
                'osd-xsrf': true,
              },
              qs: {
                path: `opensearch-forecast-result-${CUSTOM_RESULT_INDEX_NAME}*/_search`,
                method: 'POST',
              },
              body: aggregationQuery,
              failOnStatusCode: false,
            }).then((response) => {
              if (response.body && response.body.aggregations) {
                const aggs = response.body.aggregations;
                cy.task('log', 'Forecast result index response:');
                cy.task('log', JSON.stringify(aggs, null, 2));

                if (
                  aggs.min_timefield.value !== null &&
                  aggs.max_timefield.value !== null
                ) {
                  cy.task('log', 'Found forecast data. Stopping polling.');
                  return;
                }
              } else {
                cy.task(
                  'log',
                  'Could not retrieve aggregations. Full response:'
                );
                cy.task('log', JSON.stringify(response.body, null, 2));
              }

              cy.task('log', 'Forecast data not ready yet. Retrying...');
              cy.wait(5000); // wait 5 seconds before retrying
              checkResults(retriesLeft - 1);
            });
          });
        };

        checkResults(10); // Start with 10 retries
      }
    });

    cy.get('body').then(($body) => {
      if ($body.text().includes('No forecast data available')) {
        cy.setAbsoluteDate('2019-12-31 00:00:00', '2020-01-02 04:43:00');
      }
    });

    // Due to https://github.com/opensearch-project/anomaly-detection-dashboards-plugin/pull/1058 not being merged into 3.1.0,
    // the forecast chart is not visible. Skip this test for 3.1.0.
    cy.request({
      method: 'GET',
      url: `${Cypress.env('openSearchUrl')}/`,
    }).then((response) => {
      const fullVersion = response.body.version.number;
      const majorMinorVersion = fullVersion.split('.').slice(0, 2).join('.');

      if (majorMinorVersion !== '3.1') {
        cy.task(
          'log',
          `Version is ${majorMinorVersion}, checking for forecast chart.`
        );
        // Verify that the forecast chart is visible. The test will fail here
        // if the polling above times out and the chart is still not available.
        cy.get('canvas.echCanvasRenderer', { timeout: 20000 }).should(
          'be.visible'
        );
        cy.get('.echScreenReaderOnly')
          .contains('dd', /area and line chart/i)
          .should('exist');
      } else {
        cy.task(
          'log',
          'Version is 3.1, skipping forecast chart visibility check.'
        );
      }
    });

    // Step: Check flattened index and its content
    const flattenedIndexAlias = `${FLATTENED_INDEX_ALIAS_PREFIX}*`;
    cy.request({
      method: 'POST',
      url: 'api/console/proxy',
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        'osd-xsrf': true,
      },
      qs: {
        path: `${flattenedIndexAlias}/_search`,
        method: 'POST',
      },
      body: {
        query: {
          exists: {
            field: 'feature_data_value',
          },
        },
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.hits.total.value).to.be.greaterThan(0);
    });
  });
});
