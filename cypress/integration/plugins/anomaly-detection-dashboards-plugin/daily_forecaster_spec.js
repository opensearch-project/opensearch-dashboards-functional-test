/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AD_FIXTURE_BASE_PATH, FORECAST_URL } from '../../../utils/constants';

const TEST_FORECASTER_NAME = 'test-daily-forecaster';
// index name has to start with sample otherwise cy.deleteAllIndices does not delete it.
const TEST_INDEX_NAME = 'sample-daily-interval-index';
const TEST_TIMESTAMP_FIELD = 'timestamp';
const TEST_VALUE_FIELD = 'value';
const TEST_HOST_FIELD = 'host';

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

const clickControlAndVerifyChartUpdate = (buttonAriaLabel) => {
  cy.get('body').then(($body) => {
    // Only proceed if the button exists and is not disabled
    if (
      $body.find(`button[aria-label="${buttonAriaLabel}"]:not(:disabled)`)
        .length > 0
    ) {
      // Get the render count before clicking
      cy.get('.echChartStatus')
        .invoke('attr', 'data-ech-render-count')
        .then((initialRenderCount) => {
          cy.get(`button[aria-label="${buttonAriaLabel}"]`).click();

          // Cypress's .should() will automatically retry until the assertion passes or times out,
          // which handles the async nature of the re-render.
          cy.get('.echChartStatus')
            .invoke('attr', 'data-ech-render-count')
            .should('not.eq', initialRenderCount);
        });
    }
  });
};

describe('Daily interval forecaster', () => {
  before(() => {
    // Clean up any old indices
    cy.deleteAllIndices();
    cy.deleteForecastIndices();

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
    cy.fixture(AD_FIXTURE_BASE_PATH + 'daily_interval.ndjson').then((data) => {
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
    });
  });

  after(() => {
    // Clean up created resources
    cy.deleteAllIndices();
    cy.deleteForecastIndices();
  });

  it('should create, test, and interact with a daily forecaster', () => {
    // Create and test forecaster.
    cy.visit(FORECAST_URL.CREATE_FORECASTER);

    cy.request({
      method: 'GET',
      url: `${Cypress.env('openSearchUrl')}/`,
    }).then((response) => {
      const fullVersion = response.body.version.number;
      const majorMinorVersion = fullVersion.split('.').slice(0, 2).join('.');

      cy.log(`Full version: ${fullVersion}`);
      cy.log(`Major.Minor version: ${majorMinorVersion}`);

      const forecasterOptions = {
        name: TEST_FORECASTER_NAME,
        index: TEST_INDEX_NAME,
        featureField: TEST_VALUE_FIELD,
        timestampField: TEST_TIMESTAMP_FIELD,
        test: true,
      };

      // 3.1 does not support daily interval and thus suggest API would fail for daily interval data.
      // If version is 3.1, the commannd will fill in the interval field with weekly interval.
      if (majorMinorVersion === '3.1') {
        forecasterOptions.interval = 1440;
      }

      cy.createForecaster(forecasterOptions);
    });

    // Now that the forecaster is created, test its functionality.
    cy.contains('Test complete', { timeout: 180000 }).should('be.visible');
    cy.contains('Loading forecast results...', { timeout: 180000 }).should(
      'not.exist'
    );

    // Check results from 2020 to now using the super date picker.
    setAbsoluteStartDate('2020-01-01 00:00:00');

    // Click 'Start test' button and trigger test again.
    cy.getElementByTestId('startCancelTestButton').click();
    cy.contains('Test complete', { timeout: 180000 }).should('be.visible');
    cy.contains('Loading forecast results...', { timeout: 180000 }).should(
      'not.exist'
    );

    // Check results from 2020 to now using the super date picker.
    setAbsoluteStartDate('2020-01-01 00:00:00');

    // If pan left/right is not disabled, click one and check for changes.
    clickControlAndVerifyChartUpdate('Pan right');
    clickControlAndVerifyChartUpdate('Pan left');

    // If zoom in/out is not disabled, click one and check for changes.
    clickControlAndVerifyChartUpdate('Zoom in');
    clickControlAndVerifyChartUpdate('Zoom out');
  });
});
