/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// ============================================================================
// Cypress UI Test – Forecaster List Workflow
// ----------------------------------------------------------------------------
//  SCENARIOS COVERED IN THIS TEST FILE
//  1. Setup: create two sample indices and seed test data
//  2. Create a new forecaster (index‑based)
//  3. Start the forecaster from the list page
//  4. Filter the forecasters list by status (Inactive)
//  5. Filter the list by associated index name
//  6. Stop a running forecaster from the list page
//  7. Free‑text search by forecaster name
//  8. Delete a forecaster from the list page
// ============================================================================

import { AD_FIXTURE_BASE_PATH } from '../../../utils/constants';
import { setStorageItem } from '../../../utils/plugins/dashboards-assistant/helpers';
import { BASE_PATH } from '../../../utils/constants';

const setupIndexWithData = (indexName) => {
  // Create index mapping first
  cy.request({
    method: 'POST',
    url: 'api/console/proxy',
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'osd-xsrf': true,
    },
    qs: {
      path: `${indexName}`,
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
          path: `${indexName}/_bulk`,
          method: 'POST',
        },
        body: data,
      });
    }
  );
};

context('list forecaster workflow', () => {
  const TEST_FORECASTER_NAME = 'test-forecaster';
  const TEST_FORECASTER_NAME_2 = 'blah-forecaster';
  const TEST_FIELD_TO_FORECAST = 'value';
  const TEST_TIMESTAMP_FIELD = 'timestamp';
  const TEST_INDEX_NAME = 'sample-forecast-index';
  const TEST_INDEX_NAME_2 = 'sample-forecast-index-2';

  let restoreTenantSwitchModal;

  beforeEach(() => {
    // disable the tenant switch modal
    restoreTenantSwitchModal = setStorageItem(
      sessionStorage,
      'opendistro::security::tenant::show_popup',
      'false'
    );
    // Visit OSD
    // requrired otherwise we encounter connection issue in later test
    cy.visit(`${BASE_PATH}/app/home`);
    cy.deleteAllIndices();
    cy.deleteForecastIndices();

    setupIndexWithData(TEST_INDEX_NAME);
    setupIndexWithData(TEST_INDEX_NAME_2);
  });

  // Clean up created resources
  afterEach(() => {
    cy.deleteAllIndices();
    cy.deleteForecastIndices();
    if (restoreTenantSwitchModal) {
      restoreTenantSwitchModal();
    }
  });

  it('Full creation - based on real index', () => {
    // Add a network interceptor to debug 'Unexpected token <' errors.
    // This will log any requests for JavaScript files that incorrectly
    // return an HTML page, which is the usual cause of this error.
    cy.intercept('*', (req) => {
      req.on('response', (res) => {
        if (
          req.url.includes('.js') &&
          res.headers['content-type'] &&
          res.headers['content-type'].includes('text/html')
        ) {
          cy.log(
            `POTENTIAL ERROR: Request for JS file "${req.url}" received HTML content instead of JavaScript. This is likely the cause of the 'Unexpected token <' error.`
          );
        }
      });
    });

    // Visit the home page first
    cy.visit('/');

    cy.wait(20000);

    // This block handles optional pop-ups that may appear on the home page.
    // We search for the elements and click them only if they exist,
    // preventing the test from failing if the pop-ups are not present.
    cy.get('body').then(($body) => {
      const exploreButtons = $body.find('button:contains("Explore on my own")');
      if (exploreButtons.length) {
        cy.wrap(exploreButtons.first()).click();
      }
    });
    cy.get('body').then(($body) => {
      const dismissButtons = $body.find('button:contains("Dismiss")');
      if (dismissButtons.length) {
        cy.wrap(dismissButtons.first()).click();
      }
    });

    // Handles the optional "Select your tenant" pop-up
    cy.handleTenantDialog();

    cy.contains('Loading OpenSearch Dashboards', { timeout: 120000 }).should(
      'not.exist'
    );

    // The application can sometimes re-render the header after loading or
    // dismissing initial pop-ups. To prevent a "detached from the DOM" error,
    // we first ensure the button is visible and enabled before clicking.
    // This uses Cypress's built-in retry mechanism to wait for the element
    // to become stable.
    cy.get('[data-test-subj="toggleNavButton"]')
      .should('be.visible')
      .and('be.enabled')
      .click();

    // Wait for navigation to be ready, then click Forecasting
    cy.get('.euiSideNav, [data-test-subj="collapsibleNav"], nav', {
      timeout: 10000,
    }).should('be.visible');
    cy.contains('Forecasting').click();

    // Verify we're redirected to the forecasters list page
    // match ensures that the url ends with /forecasters
    cy.url().should('match', /\/forecasters$/);

    // ========== Scenario: CREATE FORECASTER ==========
    // Verify the title contains the word "Forecasters"
    cy.contains('Forecasters (0)').should('exist');
    // we have two create forecaster buttons, click any one of them
    cy.getElementByTestId('createForecasterButton').first().click();

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

    // go back to the forecasters list page
    cy.contains('Forecasting').click();

    // Verify the title contains the word "Forecasters"
    // Wait for the table to be loaded and stable by checking the header count
    cy.contains('Forecasters (1)', { timeout: 20000 }).should('be.visible');

    // Find the grid cell that contains 'Inactive'.
    cy.contains('[role="gridcell"]', 'Inactive', { timeout: 10000 }).as(
      'statusCell'
    );

    // ========== Scenario: START FORECASTER ==========
    // Click the cell to make it active and reveal the hidden controls.
    cy.get('@statusCell').click();

    // Wait a moment for the cell to become active
    cy.wait(500);

    // Try to trigger hover as well, in case that's needed
    cy.get('@statusCell').trigger('mouseover');

    // Check if the expand button is now visible, if not, try clicking again
    cy.get('@statusCell').then(($cell) => {
      const expandButton = $cell.find(
        'button.euiDataGridRowCell__expandButtonIcon'
      );
      if (expandButton.length === 0 || !expandButton.is(':visible')) {
        cy.log('Expand button not visible, trying to click cell again');
        cy.get('@statusCell').click({ force: true });
        cy.wait(500);
      }
    });

    // Find the now-visible expand button inside the cell.
    cy.get('@statusCell')
      .find('button.euiDataGridRowCell__expandButtonIcon')
      .should('be.visible')
      .as('expandButton');

    // Click the expand button to open the final popover.
    cy.get('@expandButton').click();

    // Verify the popover content is visible.
    // Instead of looking for the container div, we now directly look for the
    // EuiHealth component that displays the "Inactive" status. This is much more reliable.
    cy.get('.euiHealth').contains('Inactive').should('be.visible');

    // Find the specific grid cell that contains your forecaster's name.
    // This acts as an anchor to identify the correct "row".
    cy.contains('[role="gridcell"]', TEST_FORECASTER_NAME)

      //Get all the sibling cells of that name cell.
      .siblings('[role="gridcell"]')

      // Within those siblings, find the button with aria-label="Show actions" and click it.
      // This is the most reliable way to target the button from the HTML you provided.
      .find('button[aria-label="Show actions"]')
      .click();

    // Now that the popover is open, find the "Start forecasting" menu item and click it.
    // We target the panel specifically to ensure we don't click anything else by accident.
    cy.get('.euiContextMenuPanel').contains('Start forecasting').click();

    // Verify the 'Start forecaster' confirmation modal appears.
    cy.get('[data-test-subj="startForecasterModal"]')
      .should('be.visible')
      .and('contain', 'Start forecaster?');

    // Click the confirm button INSIDE the visible startForecasterModal.
    // This ensures we don't accidentally click a button from another hidden modal.
    cy.get('[data-test-subj="startForecasterModal"]')
      .filter(':visible')
      .find('[data-test-subj="confirmButton"]')
      .click();

    // Verify the modal disappears after confirmation
    cy.get('[data-test-subj="startForecasterModal"]').should('not.exist');

    // The status will update asynchronously. Wait for it to show 'Initializing'.
    // We check inside '.euiHealth' for more specificity.
    cy.contains('.euiHealth', 'Initializing', { timeout: 20000 }).should(
      'be.visible'
    );

    // Now, interact with the new "Initializing" status cell to view details.
    // First, find the cell.
    cy.contains('[role="gridcell"]', 'Initializing', { timeout: 10000 }).as(
      'initializingStatusCell'
    );

    // Click the cell to activate it and show the hidden controls.
    cy.get('@initializingStatusCell').click();

    // Find the expand button inside the active cell...
    cy.get('@initializingStatusCell')
      .find('button.euiDataGridRowCell__expandButtonIcon')
      .should('be.visible')
      // The expand button starts with pointer-events:none, tabindex="-1" and
      // aria-hidden="true". So it does not respond to normal pointer events
      // (e.g., click, mouseover, etc.). We need to force to work around this.
      .click({ force: true });

    // The popover should now be visible. We'll find it by looking for the
    // unique text inside it, which is more reliable than checking styles.
    cy.contains('p', 'initializing forecast since', { timeout: 10000 })
      .should('be.visible')
      .parents('div[style*="width: 250px"]')
      .first()
      .as('popoverContainer');

    // Within that popover, find the "View forecast" button and FORCE the click.
    // This is necessary because a parent element has `overflow: hidden`, which
    // makes Cypress think the button is not visible, even though it is.
    cy.get('@popoverContainer')
      .find('button.euiButton--primary')
      .should('exist') // confirm the button is in the DOM
      .click({ force: true }); // Then, force the click

    // Verify the URL has changed to the forecaster detail page.
    cy.url().should('include', '/details');

    // Verify a known element on the detail page is visible.
    cy.getElementByTestId('forecasterSettingsHeader').should('be.visible');

    // go back to the forecasters list page
    cy.contains('Forecasting').click();

    // ---------------------------------------------------------------------
    //  Scenario – CREATE SECOND FORECASTER (for filtering tests)
    // ---------------------------------------------------------------------
    // create another forecaster with a different name
    cy.getElementByTestId('createForecasterButton').click();

    // Call the new reusable command to create the forecaster
    cy.createForecaster({
      name: TEST_FORECASTER_NAME_2,
      index: TEST_INDEX_NAME_2,
      featureField: TEST_FIELD_TO_FORECAST,
      timestampField: TEST_TIMESTAMP_FIELD,
    });

    // Wait for the forecaster to be created.
    cy.wait(5000);

    // go back to the forecasters list page
    cy.contains('Forecasting').click();

    // Verify the title contains the word "Forecasters"
    // Wait for the table to be loaded and stable by checking the header count
    cy.contains('Forecasters (2)', { timeout: 20000 }).should('be.visible');

    // Find the grid cell that contains TEST_FORECASTER_NAME.
    cy.contains('[role="gridcell"]', TEST_FORECASTER_NAME, {
      timeout: 10000,
    }).as('statusCell');
    cy.contains('[role="gridcell"]', TEST_FORECASTER_NAME_2, {
      timeout: 10000,
    }).as('statusCell2');

    // =====================================================================
    //  Scenario – FILTER BY STATUS (Inactive)
    // =====================================================================
    cy.getElementByTestId('forecasterStateFilter')
      .first()
      .click()
      .type('Inactive');

    // After typing, we must select the 'Inactive' option from the dropdown list
    // for the filter to be applied.
    cy.get('.euiComboBoxOption__content').contains('Inactive').click();

    // click outside the dropdown to close it
    cy.get('body').click(0, 0);

    // synchronization point: wait until the grid has been filtered and the expected
    // item is actually rendered in the DOM.
    cy.contains('[role="gridcell"]', TEST_FORECASTER_NAME_2).should(
      'be.visible'
    );
    cy.get('[role="grid"]').should('not.contain', TEST_FORECASTER_NAME);

    cy.contains('Forecasters (1)', { timeout: 20000 }).should('be.visible');

    // Clear the 'Inactive' status filter by clicking the 'x' on the pill
    // to ensure the list is reset before the next test scenario.
    cy.get('button[aria-label^="Remove Inactive"]').click();

    // Wait for the second forecaster to be visible again before checking the count
    cy.contains('[role="gridcell"]', TEST_FORECASTER_NAME).should('be.visible');
    cy.contains('Forecasters (2)', { timeout: 20000 }).should('be.visible');

    // =====================================================================
    //  Scenario – FILTER BY INDEX NAME
    // =====================================================================
    cy.getElementByTestId('indicesFilter')
      .first()
      .click()
      .type(TEST_INDEX_NAME_2);

    // After typing, we must select the index from the dropdown list
    // for the filter to be applied.
    cy.get('.euiComboBoxOption__content').contains(TEST_INDEX_NAME_2).click();

    // click outside the dropdown to close it
    cy.get('body').click(0, 0);

    // synchronization point: wait until the grid has been filtered and the expected
    // item is actually rendered in the DOM.
    cy.contains('[role="gridcell"]', TEST_FORECASTER_NAME_2).should(
      'be.visible'
    );
    cy.get('[role="grid"]').should('not.contain', TEST_FORECASTER_NAME);

    cy.contains('Forecasters (1)', { timeout: 20000 }).should('be.visible');

    // Clear the index filter by clicking the 'x' on the pill
    // to ensure the list is reset before the next test scenario.
    cy.get(`button[aria-label^="Remove ${TEST_INDEX_NAME_2}"]`).click();

    // Wait for the other forecaster to be visible again before checking the count
    cy.contains('[role="gridcell"]', TEST_FORECASTER_NAME).should('be.visible');
    cy.contains('Forecasters (2)', { timeout: 20000 }).should('be.visible');

    // scenario: stop forecaster from list page
    // This function attempts to open a modal by clicking an action menu item.
    // It has a two-layered retry mechanism: an outer loop for each 'Show actions'
    // button, and an inner loop that retries clicking the button and menu item
    // until the specified confirmation modal appears.
    const openActionModalWithRetries = (
      menuItemText,
      modalTestSubj,
      buttonIndex,
      buttonCount
    ) => {
      // after trying all buttons, return
      if (buttonIndex >= buttonCount) {
        cy.log(
          `Could not open the "${modalTestSubj}" modal after trying all buttons.`
        );
        return;
      }

      cy.log(
        `Outer loop: Trying action button #${buttonIndex + 1} of ${buttonCount}`
      );

      // Inner recursive function to retry clicking a single button
      const attemptClickSequence = (retryCount) => {
        if (retryCount <= 0) {
          cy.log(
            `All retries failed for button #${
              buttonIndex + 1
            }. Moving to next button.`
          );
          // Move to the next "Show actions" button
          openActionModalWithRetries(
            menuItemText,
            modalTestSubj,
            buttonIndex + 1,
            buttonCount
          );
          return;
        }

        cy.log(
          `  Inner loop: Attempt #${retryCount} for button #${buttonIndex + 1}`
        );

        // Always re-query for the button to ensure it's not detached
        cy.get('button[aria-label="Show actions"]')
          .eq(buttonIndex)
          .scrollIntoView()
          .click({ force: true });

        // Poll for the menu to appear
        cy.wait(500);
        cy.get('body').then(($body) => {
          const $visibleMenu = $body.find('.euiContextMenuPanel:visible');
          if (
            $visibleMenu.length > 0 &&
            $visibleMenu.text().includes(menuItemText)
          ) {
            // The menu was visible. Re-check just before clicking to be safe.
            if (Cypress.$('.euiContextMenuPanel:visible').length > 0) {
              cy.log(`  Correct menu is visible. Clicking "${menuItemText}".`);
              cy.get('.euiContextMenuPanel:visible')
                .contains('.euiContextMenuItem', menuItemText)
                .click({ force: true });

              // After clicking, wait a moment and check if the modal appeared.
              cy.wait(500); // Wait for modal to render
              cy.get('body').then(($bodyAfterClick) => {
                if (
                  $bodyAfterClick.find(`[data-test-subj="${modalTestSubj}"]`)
                    .length > 0
                ) {
                  // SUCCESS! Modal is open. End all loops.
                  cy.log(`  Success! ${modalTestSubj} is visible.`);
                  return;
                } else {
                  // Modal did not appear. Retry the sequence.
                  cy.log(
                    '  Modal did not appear after click. Closing menu and retrying.'
                  );
                  cy.get('body').click('topLeft', { force: true });
                  cy.wait(500);
                  attemptClickSequence(retryCount - 1);
                }
              });
            } else {
              // The menu disappeared between the initial check and this one.
              cy.log('  Menu disappeared before click. Retrying.');
              cy.wait(500);
              attemptClickSequence(retryCount - 1);
            }
          } else {
            // Menu was not visible or was incorrect. Retry.
            cy.log('  Menu not visible or incorrect. Retrying.');
            if ($visibleMenu.length > 0) {
              cy.log(`  Visible menu text: "${$visibleMenu.text()}"`);
              cy.get('body').click('topLeft', { force: true });
            }
            // Give the UX more time to render the menu.
            cy.wait(2000);
            attemptClickSequence(retryCount - 1);
          }
        });
      };

      // Start the inner retry loop for the current button. Allow 3 retries.
      attemptClickSequence(3);
    };

    // Define a helper to retry clicking a confirm button until its modal disappears.
    const clickUntilGone = (modalSelector, buttonSelector, retries = 3) => {
      cy.get('body').then(($body) => {
        // Check if a VISIBLE modal matching the selector exists. This is the key fix.
        if ($body.find(`${modalSelector}:visible`).length > 0) {
          if (retries > 0) {
            cy.log(
              `Modal is visible, clicking confirm. Retries left: ${retries}`
            );
            // Target the button inside the VISIBLE modal only.
            cy.get(`${modalSelector}:visible`)
              .find(buttonSelector)
              .click({ force: true });
            cy.wait(500); // Wait for transition
            clickUntilGone(modalSelector, buttonSelector, retries - 1);
          } else {
            // If retries are exhausted, fail the test explicitly.
            cy.get(modalSelector).filter(':visible').should('not.exist');
          }
        }
        // If no visible modal is found, we assume success.
      });
    };

    // Start the stop process by getting the button count and calling the retry function.
    cy.get('button[aria-label="Show actions"]')
      .its('length')
      .then((count) => {
        if (count > 0) {
          openActionModalWithRetries(
            'Cancel forecast',
            'stopForecastersModal',
            0,
            count
          );
        } else {
          throw new Error('No "Show actions" buttons found on the page.');
        }
      });

    // After attempting with "Cancel forecast", check if the modal appeared.
    // If not, try again with "Stop forecasting". "Cancel forecast" is present
    // when state is "Initializing". "Stop forecasting" is present when state
    // is "Running". We are not sure which state the forecaster is in when the
    // real time run is triggered, so we try both.
    cy.get('body').then(($body) => {
      if (
        $body.find('[data-test-subj="stopForecastersModal"]:visible').length ===
        0
      ) {
        cy.log(
          'Modal not found with "Cancel forecast", trying "Stop forecasting".'
        );
        cy.get('button[aria-label="Show actions"]')
          .its('length')
          .then((count) => {
            if (count > 0) {
              openActionModalWithRetries(
                'Stop forecasting',
                'stopForecastersModal',
                0,
                count
              );
            }
          });
      }
    });

    // =====================================================================
    //  Scenario – STOP FORECASTER VIA ROW ACTIONS
    // =====================================================================
    // Verify the 'Stop forecaster' confirmation modal appears.
    cy.get('[data-test-subj="stopForecastersModal"]')
      .should('be.visible')
      .and('contain', 'Are you sure you want to stop the selected forecaster?');

    // Click the confirm button, retrying if the modal does not close.
    clickUntilGone(
      '[data-test-subj="stopForecastersModal"]',
      '[data-test-subj="confirmButton"]'
    );

    // Add a check for the success toast message.
    cy.log(
      `Verifying that the stop toast for "${TEST_FORECASTER_NAME}" appears.`
    );
    cy.contains(
      '.euiToast--success',
      `Successfully stopped ${TEST_FORECASTER_NAME}`,
      { timeout: 10000 }
    ).should('be.visible');

    // The status will update asynchronously. Wait for it to show 'Inactive'.
    cy.contains('.euiHealth', 'Inactive', { timeout: 20000 }).should(
      'be.visible'
    );

    // =====================================================================
    //  Scenario – FREE‑TEXT SEARCH BY FORECASTER NAME
    // =====================================================================
    cy.getElementByTestId('forecasterListSearch')
      .first()
      .click()
      .type('forecaster');

    cy.contains('Forecasters (2)', { timeout: 20000 }).should('be.visible');

    cy.contains('[role="gridcell"]', TEST_FORECASTER_NAME).should('be.visible');
    cy.contains('[role="gridcell"]', TEST_FORECASTER_NAME_2).should(
      'be.visible'
    );

    cy.getElementByTestId('forecasterListSearch')
      .first()
      .clear()
      .click()
      .type(TEST_FORECASTER_NAME);

    // synchronization point: wait until the grid has been filtered and the expected
    // item is actually rendered in the DOM.
    cy.contains('[role="gridcell"]', TEST_FORECASTER_NAME).should('be.visible');
    cy.get('[role="grid"]').should('not.contain', TEST_FORECASTER_NAME_2);

    cy.contains('Forecasters (1)', { timeout: 20000 }).should('be.visible');

    // clear the search field so the next scenario can be run
    cy.getElementByTestId('forecasterListSearch').first().clear();

    // Wait for the second forecaster to be visible again before checking the count
    cy.contains('[role="gridcell"]', TEST_FORECASTER_NAME_2).should(
      'be.visible'
    );
    cy.contains('Forecasters (2)', { timeout: 20000 }).should('be.visible');

    // =====================================================================
    //  Scenario – DELETE FORECASTER
    // =====================================================================
    // Start the delete process by getting the button count and calling the retry function.
    cy.get('button[aria-label="Show actions"]')
      .its('length')
      .then((count) => {
        if (count > 0) {
          openActionModalWithRetries(
            'Delete',
            'deleteForecastersModal',
            0,
            count
          );
        } else {
          // If no action buttons are present, it might mean the item is already gone.
          // Or the UI has changed. For now, we'll assume it's an error if we expect
          // to be able to delete something.
          throw new Error('No "Show actions" buttons found for deletion.');
        }
      });

    // Verify the 'Delete forecaster' confirmation modal appears.
    cy.get('[data-test-subj="deleteForecastersModal"]')
      .should('be.visible')
      .and(($element) => {
        const text = $element.text();
        const includesFirstName = text.includes(TEST_FORECASTER_NAME);
        const includesSecondName = text.includes(TEST_FORECASTER_NAME_2);

        // Assert that at least one of the names is in the text
        expect(includesFirstName || includesSecondName).to.be.true;
      });

    // Type 'delete' in the confirmation field to enable the button.
    cy.get('[data-test-subj="deleteForecastersModal"]')
      .filter(':visible')
      .find('[data-test-subj="typeDeleteField"]')
      .type('delete');

    // Click the confirm button, retrying if the modal does not close.
    clickUntilGone(
      '[data-test-subj="deleteForecastersModal"]',
      '[data-test-subj="confirmButton"]'
    );

    // Add a check for the success toast message.
    cy.log(`Verifying that the delete toast for appears.`);
    cy.contains('.euiToast--success', `Successfully deleted`, {
      timeout: 10000,
    }).should('be.visible');

    // The status will update asynchronously. Wait for it to show 'Inactive'.
    cy.contains('Forecasters (1)', { timeout: 20000 }).should('be.visible');
  });
});
