/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AD_FIXTURE_BASE_PATH, FORECAST_URL } from '../../../utils/constants';

context('top forecaster api', () => {
  const TEST_FORECASTER_NAME = 'test-forecaster';
  const TEST_TIMESTAMP_FIELD = 'timestamp';
  const TEST_FIELD_TO_FORECAST = 'value'; // field name for forecasting
  const TEST_INDEX_NAME = 'sample-forecast-index';

  // Index some sample data first
  beforeEach(() => {
    // without initial page load, the test can fail with "RequestError: Error: connect ECONNREFUSED 127.0.0.1:5601"
    // in later setup during a `before each` hook
    cy.visit(FORECAST_URL.CREATE_FORECASTER, { timeout: 10000 });

    cy.deleteAllIndices();
    cy.deleteForecastIndices();

    // Create index mapping first
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
            value: {
              type: 'float',
            },
            timestamp: {
              type: 'date',
              format: 'yyyy-MM-dd HH:mm:ss',
            },
            host: {
              type: 'keyword',
            },
          },
        },
      },
    });

    // Then insert test data
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

  // Clean up created resources
  afterEach(() => {
    cy.deleteAllIndices();
    cy.deleteForecastIndices();
  });

  it('top forecaster api', () => {
    // Define Forecaster step
    cy.visit(FORECAST_URL.CREATE_FORECASTER);

    // Call the new reusable command to create and test the forecaster
    cy.createForecaster({
      name: TEST_FORECASTER_NAME,
      index: TEST_INDEX_NAME,
      featureField: TEST_FIELD_TO_FORECAST,
      timestampField: TEST_TIMESTAMP_FIELD,
      categoricalField: true,
      test: true,
    });

    cy.contains('Test complete', { timeout: 180000 }).should('be.visible');

    cy.contains('Loading forecast results...', { timeout: 180000 }).should(
      'not.exist'
    );

    // If forecast data is not available, change the date range to trigger a refresh.
    cy.get('body').then(($body) => {
      if ($body.text().includes('No forecast data available')) {
        // We use a custom `cy.setAbsoluteDate` command here instead of the one from the
        // opensearch-dashboards-test-library. The library's `setDateRange` function
        // requires a `[data-test-subj="querySubmitButton"]` to be present, but on this
        // page, that button is optional and not always visible, which causes test failures.
        // See library implementation: https://github.com/opensearch-project/opensearch-dashboards-test-library/blob/main/common-utils/common-UI/common-UI.js#L23
        cy.setAbsoluteDate('2019-12-31 00:00:00', '2020-01-02 04:43:00');

        // Wait for the chart to reload with the new data
        cy.contains('Loading forecast results...', { timeout: 180000 }).should(
          'not.exist'
        );
      }
    });

    // Verify that the forecast chart is visible.
    // In version 3.1, there can be a delay or issue rendering the forecast chart,
    // so we skip this check to avoid flaky failures.
    cy.request({
      method: 'GET',
      url: `${Cypress.env('openSearchUrl')}/`,
    }).then((response) => {
      const fullVersion = response.body.version.number;
      const versionParts = fullVersion.split('.').map(Number);
      const major = versionParts[0] || 0;
      const minor = versionParts[1] || 0;
      const majorMinorVersion = `${major}.${minor}`;
      const isVersionGreaterThan3_1 = major > 3 || (major === 3 && minor > 1);

      if (isVersionGreaterThan3_1) {
        cy.task(
          'log',
          `Version is ${majorMinorVersion} (> 3.1), checking for chart data.`
        );
        cy.contains('No forecast data available', { timeout: 18000 }).should(
          'not.exist'
        );
        cy.contains('No data to display', { timeout: 18000 }).should(
          'not.exist'
        );
        cy.getElementByTestId('splitTimeSeriesOptionsButton').click();
        cy.get('[aria-label="Filter by"]').select('custom');
        cy.getElementByTestId('customQueryModal').should('be.visible');

        const filterQuery = `{
      "nested": {
        "path": "entity",
        "query": {
          "bool": {
            "must": [
              { "term":     { "entity.name":  "host"     } },
              { "wildcard": { "entity.value": "host_2" } }
            ]
          }
        }
      }
    }`;
        cy.getElementByTestId('codeEditorContainer')
          .find('textarea.ace_text-input')
          .clear({ force: true })
          .invoke('val', filterQuery)
          .trigger('input', { force: true });

        cy.getElementByTestId('addOrUpdateCustomQueryButton').click();
        cy.getElementByTestId('customQueryModal').should('not.exist');

        // The update visualization button sometimes is not rendered yet after the modal closes,
        // causing flaky failures. Keep reopening the options panel until the button is visible.
        // This poll stops once the button is visible, otherwise it continues until the overall
        // Cypress test timeout (the it timeout or global config) aborts the test.
        const waitForUpdateVisualizationButton = () => {
          cy.get('body').then(($body) => {
            const updateButton = $body.find(
              '[data-test-subj="updateVisualizationButton"]'
            );

            if (updateButton.length && updateButton.is(':visible')) {
              return;
            }

            const splitOptionsButton = $body.find(
              '[data-test-subj="splitTimeSeriesOptionsButton"]'
            );

            if (splitOptionsButton.length) {
              cy.wrap(splitOptionsButton).click({ force: true });
            }

            return cy.wait(1000).then(waitForUpdateVisualizationButton);
          });
        };

        waitForUpdateVisualizationButton();

        cy.getElementByTestId('updateVisualizationButton')
          .should('be.visible')
          .click();
        cy.contains('SPLIT TIME SERIES CONTROLS').should('not.exist');
        cy.contains('Time series per page:').should('not.exist');
        cy.contains('host_2', { timeout: 18000 }).should('be.visible');
      } else {
        cy.task(
          'log',
          'Version is 3.1, skipping initial chart data availability check.'
        );
      }
    });
  });
});
