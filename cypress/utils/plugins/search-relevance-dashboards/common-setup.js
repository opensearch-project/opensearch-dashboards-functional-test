/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Common setup functions for search relevance tests

import { SEARCH_RELEVANCE_PLUGIN_NAME } from './constants';
import { BASE_PATH } from '../../base_constants';

/**
 * Wait for an asynchronously-created judgment to finish processing.
 *
 * UBI/LLM judgments are created asynchronously: the create call returns HTTP 200
 * immediately with status=PROCESSING and an empty ratings list, then the ratings
 * are computed in the background and the status flips to COMPLETED. The judgment
 * detail view fetches once on mount and does not poll, so asserting on ratings
 * right after the create call races the background job and intermittently sees an
 * empty ("No items found") ratings table. The listing page reflects the final
 * COMPLETED status, so poll it (reloading each attempt to get a fresh DOM) until
 * the named judgment completes before navigating to the detail view.
 */
export const waitForJudgmentCompleted = (judgmentName, attemptsLeft = 18) => {
  cy.visit(`${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/judgment`);
  cy.contains('tr', judgmentName, { timeout: 30000 }).then(($row) => {
    const rowText = $row.text();
    if (rowText.includes('COMPLETED')) {
      return;
    }
    if (rowText.includes('ERROR')) {
      throw new Error(`Judgment "${judgmentName}" finished with ERROR status`);
    }
    if (attemptsLeft <= 0) {
      throw new Error(
        `Judgment "${judgmentName}" did not reach COMPLETED status in time`
      );
    }
    cy.wait(10000);
    waitForJudgmentCompleted(judgmentName, attemptsLeft - 1);
  });
};

/**
 * Enable the search relevance workbench UI toggle
 */
export const enableWorkbenchUI = () => {
  // enable backend feature flag
  cy.enableSearchRelevanceWorkbench();
  // Visit the base URL first to ensure we're logged in
  cy.visit(Cypress.config().baseUrl, { timeout: 20000 });
  cy.wait(2000);

  // Visit the settings page with retry logic
  cy.visit('app/management/opensearch-dashboards/settings', { timeout: 20000 });
  cy.wait(3000); // Wait for page to stabilize
  cy.waitForLoader();

  // Check current state of the toggle with increased timeout
  cy.get(
    'button[role="switch"][data-test-subj="advancedSetting-editField-search-relevance:experimental_workbench_ui_enabled"]',
    { timeout: 60000 }
  ).then(($button) => {
    const isEnabled = $button.attr('aria-checked') === 'true';

    // Only click if not already enabled
    if (!isEnabled) {
      cy.wrap($button).click({ force: true });
      cy.wait(1000); // Wait for UI to update
      cy.get('[data-test-subj="advancedSetting-saveButton"]', {
        timeout: 10000,
      }).click({
        force: true,
      });
      cy.wait(5000); // Wait for save to complete
    }
  });

  // Navigate back to home to ensure settings are applied
  cy.visit(Cypress.config().baseUrl, { timeout: 10000 });
  cy.wait(2000);
};

/**
 * Initialize UBI indices required for tests
 */
export const initializeUbiIndices = () => {
  // Delete and recreate ubi_queries index
  cy.deleteIndex('ubi_queries');
  cy.wait(1000);

  // Create ubi_queries index with proper mapping
  cy.createIndex('ubi_queries', null, {
    mappings: {
      properties: {
        user_query: {
          type: 'keyword',
        },
        application: {
          type: 'keyword',
        },
        query_id: {
          type: 'keyword',
        },
        client_id: {
          type: 'keyword',
        },
        query_attributes: {
          type: 'object',
        },
        timestamp: {
          type: 'date',
        },
      },
    },
  });

  // Add a sample document to ubi_queries
  cy.insertDocumentToIndex('ubi_queries', undefined, {
    application: 'esci_ubi_sample',
    query_id: '33198ee9-5912-453c-9173-3f92fd3cb1be',
    client_id: '127c9afc-01c9-4084-912f-f318569f96c7',
    user_query: 'futon frames full size without mattress',
    query_attributes: {},
    timestamp: '2024-12-10T00:01:29.378Z',
  });

  // Delete and recreate ubi_events index
  cy.deleteIndex('ubi_events');
  cy.wait(1000);

  // Create ubi_events index with proper mapping
  cy.createIndex('ubi_events', null, {
    mappings: {
      properties: {
        application: {
          type: 'keyword',
        },
        action_name: {
          type: 'keyword',
        },
        query_id: {
          type: 'keyword',
        },
        session_id: {
          type: 'keyword',
        },
        client_id: {
          type: 'keyword',
        },
        timestamp: {
          type: 'date',
        },
        user_query: {
          type: 'keyword',
        },
        message_type: {
          type: 'keyword',
        },
        message: {
          type: 'text',
        },
        event_attributes: {
          type: 'object',
        },
      },
    },
  });

  // Add a sample document to ubi_events
  cy.insertDocumentToIndex('ubi_events', undefined, {
    application: 'esci_ubi_sample',
    action_name: 'impression',
    query_id: '33198ee9-5912-453c-9173-3f92fd3cb1be',
    session_id: '94cb50fb-c3af-4a69-91d9-cdd9e86d6297',
    client_id: '127c9afc-01c9-4084-912f-f318569f96c7',
    timestamp: '2024-12-10T00:01:29.378Z',
    user_query: 'futon frames full size without mattress',
    message_type: null,
    message: null,
    event_attributes: {
      object: {
        object_id: 'B07CVR21VN',
        object_id_field: 'asin',
      },
      position: {
        ordinal: 0,
      },
    },
  });
};

/**
 * Prepare sample_index for search configurations
 */
export const prepareSampleIndex = () => {
  cy.insertDocumentToIndex('00sample_index', undefined, {
    name: 'bafuton frames full size without mattressnana 00',
    price: 1999,
    description: 'this is futon frames full size without mattress 00',
  });
  cy.insertDocumentToIndex('00sample_index', undefined, {
    name: 'bafuton frames full size without mattressnana 01',
    price: 1999,
    description: 'this is futon frames full size without mattress 01',
  });
  cy.insertDocumentToIndex('00sample_index', undefined, {
    name: 'bafuton frames full size without mattressnana 02',
    price: 1999,
    description: 'this is futon frames full size without mattress 02',
  });
};
