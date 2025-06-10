/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AD_FIXTURE_BASE_PATH, FORECAST_URL } from '../../../utils/constants';

describe('Forecaster list page mock', () => {
  before(function () {
    cy.request({
      method: 'GET',
      url: `${Cypress.env('openSearchUrl')}/`,
    }).then((response) => {
      const fullVersion = response.body.version.number;
      const majorMinorVersion = fullVersion.split('.').slice(0, 2).join('.');
      if (majorMinorVersion === '3.1') {
        // This PR is not included in 3.1, so we would not see the "Cancel forecast"
        // option when the forecaster is in an error state.
        // https://github.com/opensearch-project/anomaly-detection-dashboards-plugin/pull/1054
        this.skip();
      }
    });
  });

  it('Stop single forecaster', () => {
    cy.mockGetForecastersOnAction(
      AD_FIXTURE_BASE_PATH + 'single_running_forecaster_response.json',
      () => {
        cy.visit(FORECAST_URL.FORECASTER_LIST);
      }
    );

    cy.getElementByTestId('stopForecastersModal').should('not.exist');

    cy.contains('[role="gridcell"]', 'running-forecaster')
      .parent()
      .as('forecastRow'); // Wait until that same row shows the status "Error"

    cy.get('@forecastRow')
      .contains('[role="gridcell"]', 'Error', { timeout: 10000 }) // auto-retries
      .should('be.visible');

    // Find the specific grid cell that contains your forecaster's name.
    // This acts as an anchor to identify the correct "row".
    function clickCancelForecast(retries = 5) {
      cy.get('body').then(($body) => {
        const hasItem = $body.find(
          '.euiContextMenuPanel:contains("Cancel forecast")'
        ).length;

        if (hasItem) {
          cy.contains('.euiContextMenuPanel', 'Cancel forecast').click();
        } else if (retries > 0) {
          // Close any stray pop-over, wait, and try again
          cy.get('body').type('{esc}');
          cy.wait(500);

          cy.contains('[role="gridcell"]', 'running-forecaster')
            .siblings('[role="gridcell"]')
            .find('button[aria-label="Show actions"]')
            .click({ force: true });

          clickCancelForecast(retries - 1);
        } else {
          throw new Error('“Cancel forecast” never appeared');
        }
      });
    }

    // Usage
    clickCancelForecast();

    // Verify the 'Start forecaster' confirmation modal appears.
    cy.get('[data-test-subj="stopForecastersModal"]')
      .should('be.visible')
      .and('contain', 'Are you sure you want to stop the selected forecaster?');

    cy.mockStopForecasterOnAction(
      AD_FIXTURE_BASE_PATH + 'stop_forecaster_response.json',
      'ulgqpXEBqtadYz9j2MHG',
      () => {
        // Click the confirm button INSIDE the visible startForecasterModal.
        // This ensures we don't accidentally click a button from another hidden modal.
        cy.get('[data-test-subj="stopForecastersModal"]')
          .filter(':visible')
          .find('[data-test-subj="confirmButton"]')
          .click();
      }
    );

    // Verify the modal disappears after confirmation
    cy.get('[data-test-subj="stopForecastersModal"]').should('not.exist');

    cy.contains('Successfully stopped running-forecaster');

    cy.mockGetForecastersOnAction(
      AD_FIXTURE_BASE_PATH + 'single_stopped_forecaster_response.json',
      () => {
        cy.reload();
      }
    );

    cy.contains('[role="gridcell"]', 'running-forecaster')
      .parent()
      .as('forecastRow'); // Wait until that same row shows the status "Error"

    cy.get('@forecastRow')
      .contains('[role="gridcell"]', 'Inactive', { timeout: 10000 }) // auto-retries
      .should('be.visible');
  });
});
