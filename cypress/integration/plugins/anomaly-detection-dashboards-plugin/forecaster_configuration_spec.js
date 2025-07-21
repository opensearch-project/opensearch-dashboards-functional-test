/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AD_FIXTURE_BASE_PATH, FORECAST_URL } from '../../../utils/constants';
import { selectTopItemFromFilter } from '../../../utils/helpers';

/*
 * Scenarios covered in this Cypress test:
 * 1. **Forecaster creation** – create a brand-new forecaster against a sample index and
 *    confirm the details page renders.
 * 2. **Update settings – add category field** – open the settings fly-out,
 *    enable the *category field* option, pick the first value, and verify the
 *    “Forecaster updated” toast appears with no hidden errors.
 * 3. **Validation guardrail** – enter an invalid *history* value (3 < 40) and
 *    confirm the inline validation message blocks the save.
 * 4. **Dry-run test with insufficient data** – run a test with `history=40,
 *    interval=40` and expect the “not enough data” warning.
 * 5. **Dry-run test success path** – lower `interval` to 2, rerun the test, and
 *    check for the “Test complete” toast (no data-shortage warning).
 * 6. **Delete forecaster** – delete from the details page, type *delete* in the
 *    confirmation modal, and verify redirect to the forecaster list.
 */
context('edit forecaster workflow', () => {
  const TEST_FORECASTER_NAME = 'test-forecaster';
  const TEST_TIMESTAMP_FIELD = 'timestamp';
  const TEST_FIELD_TO_FORECAST = 'value_field'; // field name for forecasting
  const TEST_INDEX_NAME = 'sample-forecast-index';

  // Index some sample data first
  beforeEach(() => {
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

  it('Create, edit, and delete a forecaster', () => {
    // Define Forecaster step
    cy.visit(FORECAST_URL.CREATE_FORECASTER);

    // Call the new reusable command to create the forecaster
    cy.createForecaster({
      name: TEST_FORECASTER_NAME,
      index: TEST_INDEX_NAME,
      featureField: TEST_FIELD_TO_FORECAST,
      timestampField: TEST_TIMESTAMP_FIELD,
    });

    // Wait for the forecaster to be created.
    cy.wait(5000);

    // Lands on the forecaster details page by default.
    cy.getElementByTestId('forecasterSettingsHeader').should('exist');
    cy.getElementByTestId('forecasterDetailsHeader').should('exist');

    cy.getElementByTestId('editForecasterSettingsButton').first().click();
    // Wait for the checkbox to be visible and enabled before clicking
    cy.get('label[for="categoryFieldCheckbox"]').click();

    // Select the first item from the category field combo box
    selectTopItemFromFilter('categoryFieldComboBox', true);
    cy.getElementByTestId('updateForecasterSettingsButton').click();

    cy.contains('Forecaster updated:', { timeout: 5000 }).should('be.visible');
    cy.contains(`Forecaster updated: ${TEST_FORECASTER_NAME}`, {
      timeout: 5000,
    }).should('be.visible');
    // We check that the body does not contain 'fail' or 'error' in a
    // case-insensitive manner.
    cy.get('body')
      .invoke('text')
      .then((text) => {
        expect(text.toLowerCase()).to.not.contain('fail');
        expect(text.toLowerCase()).to.not.contain('error');
      });

    // Verify validation for history field
    cy.getElementByTestId('editForecasterSettingsButton').first().click();
    cy.get('input[name="history"]').clear().type('3');
    cy.getElementByTestId('updateForecasterSettingsButton').click();

    // Assert that the validation error message is visible
    cy.contains('Must be an integer of at least 40.').should('be.visible');

    // We are not expecting a 'Forecaster updated' message.
    // cy.contains will fail if the element is not found.
    // Instead, we check that the body does not contain the text.
    cy.get('body').should('not.contain', 'Forecaster updated:');

    cy.getElementByTestId('editForecasterSettingsButton').first().click();
    // enter valid history value and try again.
    cy.get('input[name="history"]').clear().type('40');
    cy.get('input[name="interval"]').clear().type('40');
    cy.getElementByTestId('updateTestForecasterSettingsButton').click();

    cy.contains(`Forecaster updated: ${TEST_FORECASTER_NAME}`, {
      timeout: 5000,
    }).should('be.visible');

    cy.contains(`Successfully started test for ${TEST_FORECASTER_NAME}`, {
      timeout: 5000,
    }).should('be.visible');

    cy.contains(
      'The test cannot start as there is not enough data. Data is required between',
      { timeout: 180000 }
    ).should('be.visible');

    cy.getElementByTestId('editForecasterSettingsButton').first().click();
    cy.get('input[name="interval"]').clear().type('2');
    cy.getElementByTestId('updateTestForecasterSettingsButton').click();
    cy.contains('Test complete', { timeout: 180000 }).should('be.visible');
    cy.get('body').should(
      'not.contain',
      'The test cannot start as there is not enough data. Data is required between'
    );

    // delete forecaster
    cy.getElementByTestId('trashButton').click();

    // Wait for the delete confirmation modal to appear
    cy.getElementByTestId('deleteForecastersModal').should('exist');
    cy.contains('Are you sure you want to delete').should('be.visible');

    // Type 'delete' in the confirmation field
    cy.getElementByTestId('typeDeleteField').type('delete', { force: true });

    // Click the confirm button to delete the forecaster
    cy.getElementByTestId('confirmButton').click();

    // Verify we're redirected to the forecasters list page
    // match ensures that the url ends with /forecasters
    cy.url().should('match', /\/forecasters$/);
    // Verify the title contains the word "Forecasters"
    cy.contains('Forecasters').should('exist');
  });
});
