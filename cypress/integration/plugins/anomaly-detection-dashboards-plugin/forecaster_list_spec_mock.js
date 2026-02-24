/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AD_FIXTURE_BASE_PATH, FORECAST_URL } from '../../../utils/constants';

describe('Forecaster list page mock', () => {
  before(function () {
    // Set the default tenant to 'global' to avoid the "Select your tenant" pop-up
    // as the timing of the pop-up is not deterministic.
    // I checked brownser'sDevTools → Application → Local Storage (and Session Storage)
    //  → look for keys containing “security” and “tenant”. I found:
    // opendistro::security::tenant::savedopendistro::security::tenant::saved:""""
    // Just to be safe, instead of using the key directly, we use the following code
    // to find the key and set the value to 'global'.
    cy.visit('/', {
      onBeforeLoad(win) {
        const key = Object.keys(win.localStorage).find(
          (k) => k.includes('security') && k.includes('tenant')
        );
        if (key) win.localStorage.setItem(key, 'global');
      },
    });

    // Get OpenSearch version.
    cy.request({
      method: 'GET',
      url: `${Cypress.env('openSearchUrl')}/`,
    }).then((response) => {
      const fullVersion = response.body.version.number;
      const versionParts = fullVersion.split('.').map(Number);
      const major = versionParts[0] || 0;
      const minor = versionParts[1] || 0;
      const majorMinorVersion = `${major}.${minor}`;
      const isVersion3_1_or_less = major < 3 || (major === 3 && minor <= 1);

      if (isVersion3_1_or_less) {
        // Forecasting features were introduced in 3.1. Also, a required PR
        // is not included in 3.1, so we skip this test for versions 3.1 and older.
        // https://github.com/opensearch-project/anomaly-detection-dashboards-plugin/pull/1054
        cy.task(
          'log',
          `Version is ${majorMinorVersion} (<= 3.1), skipping test.`
        );
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
