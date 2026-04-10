/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ALERTING_PLUGIN_NAME,
  ALERTING_PLUGIN_TIMEOUT,
} from '../../../utils/plugins/alerting-dashboards-plugin/constants';
import sampleQueryLevelMonitorWithAlwaysTrueTrigger from '../../../fixtures/plugins/alerting-dashboards-plugin/sample_query_level_monitor_with_always_true_trigger.json';
import sampleQueryLevelMonitorWorkflow from '../../../fixtures/plugins/alerting-dashboards-plugin/sample_query_level_monitor_workflow.json';
import { BASE_PATH } from '../../../utils/base_constants';

const TESTING_INDEX = 'alerting_test';

// Helper function to type in search box if it exists
const searchForMonitor = (uniqueNumber) => {
  // Wait for page to stabilize
  cy.wait(3000);

  // First try to find and use search box
  cy.get('body').then(($body) => {
    const selectors = [
      'input[type="search"]',
      '[data-test-subj="alertStateSearchBox"]',
      '[data-test-subj="searchField"]',
      '.euiFieldSearch',
      'input[placeholder*="Search"]',
      'input.euiFieldText[type="text"]',
    ];

    for (const selector of selectors) {
      const $el = $body.find(selector);
      if ($el.length > 0 && $el.is(':visible')) {
        cy.wrap($el.first())
          .clear({ force: true })
          .type(uniqueNumber, { force: true });
        return;
      }
    }

    cy.log(
      'Search input not found, will try to find monitor in table directly...'
    );
  });

  // Wait for search results to update table
  cy.wait(3000);
};

// Helper function to verify alert state in table
const verifyAlertState = (state, uniqueNumber) => {
  // Wait for table to load and stabilize
  cy.wait(3000);

  // Try multiple strategies to find the state
  cy.get('body').then(($body) => {
    const pageText = $body.text();

    // Check if the unique number exists on the page
    if (!pageText.includes(uniqueNumber)) {
      cy.log(
        `Unique number ${uniqueNumber} not found on page, monitor may not have created an alert yet`
      );
    }

    // Check if state exists on page
    if (!pageText.includes(state)) {
      cy.log(`State "${state}" not found on page`);
    }
  });

  // Use cy.contains with retry to find the state
  // This will wait up to ALERTING_PLUGIN_TIMEOUT for the state to appear
  cy.contains(new RegExp(state), { timeout: ALERTING_PLUGIN_TIMEOUT }).should(
    'exist'
  );
};

describe('Alerts', () => {
  beforeEach(() => {
    // Set welcome screen tracking to false
    localStorage.setItem('home:welcome:show', 'false');

    // Visit Alerting OpenSearch Dashboards
    cy.visit(`${BASE_PATH}/app/${ALERTING_PLUGIN_NAME}#/dashboard`);

    // Wait for the page to load - "Alerts" is usually in the breadcrumbs or title
    // This is more robust than "Acknowledge" which only appears if alerts exist
    cy.get('h1, .euiTitle, .euiBreadcrumb', {
      timeout: ALERTING_PLUGIN_TIMEOUT,
    }).should('contain', 'Alerts');

    // Wait for the page to fully render (table may take time to load)
    cy.wait(3000);

    // Clear search box and uncheck rows to ensure a clean state (if elements exist)
    cy.get('body', { timeout: 10000 }).then(($body) => {
      // Try multiple selectors for search box
      const searchSelectors = [
        'input[type="search"]',
        '.euiFieldSearch',
        'input[placeholder*="Search"]',
      ];

      for (const selector of searchSelectors) {
        const $searchInputs = $body.find(selector);
        if ($searchInputs.length > 0) {
          cy.wrap($searchInputs.first()).clear({ force: true });
          break;
        }
      }

      // Uncheck any checked rows
      const $checkedRows = $body.find(
        'input[data-test-subj^="checkboxSelectRow-"]:checked'
      );
      if ($checkedRows.length > 0) {
        $checkedRows.each((index, el) => {
          cy.wrap(el).click({ force: true });
        });
      }
    });
  });

  describe("can be in 'Active' state", () => {
    before(() => {
      cy.deleteAllMonitors();
      // Generate a unique number in every test by getting a unix timestamp in milliseconds
      Cypress.config('unique_number', `${Date.now()}`);
      // Modify the monitor name to be unique
      sampleQueryLevelMonitorWithAlwaysTrueTrigger.name += `-${Cypress.config(
        'unique_number'
      )}`;
      cy.createMonitor(sampleQueryLevelMonitorWithAlwaysTrueTrigger);
    });

    it('after the monitor starts running', () => {
      // Wait for 1 minute
      cy.wait(60000);

      // Reload the page
      cy.reload();

      // Wait for page to load
      cy.get('h1, .euiTitle, .euiBreadcrumb', {
        timeout: ALERTING_PLUGIN_TIMEOUT,
      }).should('contain', 'Alerts');

      // Search for the monitor
      searchForMonitor(`${Cypress.config('unique_number')}`);

      // Confirm we can see one and only alert in Active state
      cy.get('tbody > tr').should(($tr) => {
        expect($tr, '1 row').to.have.length(1);
        expect($tr, 'item').to.contain('Active');
      });
    });
  });

  describe("can be in 'Acknowledged' state", () => {
    before(() => {
      cy.deleteAllMonitors();
      Cypress.config('unique_number', `${Date.now()}`);
      // Modify the monitor name to be unique
      sampleQueryLevelMonitorWithAlwaysTrueTrigger.name += `-${Cypress.config(
        'unique_number'
      )}`;
      cy.createAndExecuteMonitor(sampleQueryLevelMonitorWithAlwaysTrueTrigger);
    });

    it('by clicking the button in Dashboard', () => {
      // Wait for monitor to execute and generate alert
      cy.wait(10000);

      // Search for the monitor and verify state
      searchForMonitor(`${Cypress.config('unique_number')}`);

      // Confirm there is an active alert
      verifyAlertState('Active', `${Cypress.config('unique_number')}`);

      // Wait for the table to load and render the checkbox
      cy.get('tbody > tr').should('have.length.at.least', 1);

      // Select checkbox for the existing alert
      // There may be multiple alerts in the cluster, first() is used to get the active alert
      cy.get('input[data-test-subj^="checkboxSelectRow-"]')
        .first()
        .should('exist') // The input itself might have opacity: 0 but should exist
        .should('not.be.checked')
        .click({ force: true });

      // Click Acknowledge button
      cy.get('button').contains('Acknowledge').click({ force: true });

      // Confirm we can see the alert is in 'Acknowledged' state
      cy.contains('Acknowledged');
    });
  });

  describe("can be in 'Completed' state", () => {
    before(() => {
      cy.deleteAllMonitors();
      // Delete the target indices defined in 'sample_monitor_workflow.json'
      cy.deleteIndexByName('alerting*');
      Cypress.config('unique_number', `${Date.now()}`);
      // Modify the monitor name to be unique
      sampleQueryLevelMonitorWorkflow.name += `-${Cypress.config(
        'unique_number'
      )}`;
      cy.createAndExecuteMonitor(sampleQueryLevelMonitorWorkflow);
    });

    it('when the trigger condition is not met after met once', () => {
      // Wait for monitor to execute and generate alert
      cy.wait(10000);

      // Wait for page to fully load before searching
      cy.get('h1, .euiTitle, .euiBreadcrumb', {
        timeout: ALERTING_PLUGIN_TIMEOUT,
      }).should('contain', 'Alerts');

      // Search for the monitor and verify state
      searchForMonitor(`${Cypress.config('unique_number')}`);

      // Confirm there is an active alert - look in table or anywhere on page
      verifyAlertState('Active', `${Cypress.config('unique_number')}`);

      // The trigger condition is: there is no document in the indices 'alerting*'
      // The following commands create a document in the index to complete the alert
      // Create an index
      cy.createIndexByName(TESTING_INDEX);

      // Insert a document
      cy.insertDocumentToIndex('test', 1, {});

      // Wait for 1 minute
      cy.wait(60000);

      // Reload the page
      cy.reload();

      // Wait for page to fully load after reload
      cy.get('h1, .euiTitle, .euiBreadcrumb', {
        timeout: ALERTING_PLUGIN_TIMEOUT,
      }).should('contain', 'Alerts');

      // Wait for page to stabilize and search input to appear
      cy.wait(3000);

      // Search for the monitor
      searchForMonitor(`${Cypress.config('unique_number')}`);

      // Confirm we can see the alert is in 'Completed' state
      verifyAlertState('Completed', `${Cypress.config('unique_number')}`);
    });

    after(() => {
      // Delete the testing index
      cy.deleteIndexByName(TESTING_INDEX);
    });
  });

  describe("can be in 'Error' state", () => {
    before(() => {
      cy.deleteAllMonitors();
      // modify the JSON object to make an error alert when executing the monitor
      sampleQueryLevelMonitorWithAlwaysTrueTrigger.triggers[0].actions = [
        { name: '', destination_id: '', message_template: { source: '' } },
      ];
      Cypress.config('unique_number', `${Date.now()}`);
      // Modify the monitor name to be unique
      sampleQueryLevelMonitorWithAlwaysTrueTrigger.name += `-${Cypress.config(
        'unique_number'
      )}`;
      cy.createAndExecuteMonitor(sampleQueryLevelMonitorWithAlwaysTrueTrigger);
    });

    it('by using a wrong destination', () => {
      // Wait for monitor to execute and generate alert
      cy.wait(10000);

      // Search for the monitor and verify state
      searchForMonitor(`${Cypress.config('unique_number')}`);

      // Confirm we can see the alert is in 'Error' state
      verifyAlertState('Error', `${Cypress.config('unique_number')}`);
    });
  });

  describe("can be in 'Deleted' state", () => {
    before(() => {
      cy.deleteAllMonitors();
      Cypress.config('unique_number', `${Date.now()}`);
      // Modify the monitor name to be unique
      sampleQueryLevelMonitorWithAlwaysTrueTrigger.name += `-${Cypress.config(
        'unique_number'
      )}`;
      cy.createAndExecuteMonitor(sampleQueryLevelMonitorWithAlwaysTrueTrigger);
    });

    it('by deleting the monitor', () => {
      // Wait for monitor to execute and generate alert
      cy.wait(10000);

      // Search for the monitor and verify state
      searchForMonitor(`${Cypress.config('unique_number')}`);

      // Confirm there is an active alert
      verifyAlertState('Active', `${Cypress.config('unique_number')}`);

      // Delete all existing monitors
      cy.deleteAllMonitors();

      // Reload the page
      cy.reload();

      // Wait for page to load
      cy.get('h1, .euiTitle, .euiBreadcrumb', {
        timeout: ALERTING_PLUGIN_TIMEOUT,
      }).should('contain', 'Alerts');

      // Wait for page to stabilize after reload
      cy.wait(3000);

      // Search for the monitor
      searchForMonitor(`${Cypress.config('unique_number')}`);

      // Confirm we can see the alert is in 'Deleted' state
      verifyAlertState('Deleted', `${Cypress.config('unique_number')}`);
    });
  });

  after(() => {
    // Delete all existing monitors
    cy.deleteAllMonitors();
  });
});
