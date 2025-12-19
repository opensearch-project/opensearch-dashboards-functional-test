/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { SEARCH_RELEVANCE_PLUGIN_NAME } from '../../../utils/plugins/search-relevance-dashboards/constants';
import { BASE_PATH } from '../../../utils/base_constants';
import {
  initializeUbiIndices,
  enableWorkbenchUI,
} from '../../../utils/plugins/search-relevance-dashboards/common-setup';
import 'cypress-file-upload';

describe('Query Set Creation', () => {
  before(() => {
    cy.visit(Cypress.config().baseUrl, { timeout: 10000 });

    // Initialize UBI indices required for tests
    initializeUbiIndices();
    // Enable the search relevance workbench UI
    enableWorkbenchUI();
  });

  beforeEach(() => {
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/querySet/create`
    );
    cy.wait(5000); // Increase wait time to ensure form is fully loaded
    cy.waitForLoader();
  });

  it('Should fail query set creation with more than 1000 queries', () => {
    // Fill in the required fields
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .first()
      .focus()
      .type('Test UBI Query Set');
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .last()
      .focus()
      .type('Test UBI Query Set Description');

    // Select sampling method
    cy.get('[data-test-subj="querySetSamplingSelect"]').select('random');

    // Set query set size to 1010
    cy.get('[data-test-subj="querySetSizeInput"]').type('10');

    // Click create button
    cy.get('[data-test-subj="createQuerySetButton"]').click();

    // Expect Forbidden error message
    cy.contains('Failed to create query set', { timeout: 10000 });
  });

  it('Should succeed UBI query set creation with 200 status', () => {
    // Fill in the required fields
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .first()
      .focus()
      .type('Test UBI Query Set');
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .last()
      .focus()
      .type('Test UBI Query Set Description');

    // Select sampling method
    cy.get('[data-test-subj="querySetSamplingSelect"]').select('random');

    // Click create button
    cy.get('[data-test-subj="createQuerySetButton"]').click();

    // Expect success message
    cy.contains('Query set "Test UBI Query Set" created successfully', {
      timeout: 10000,
    });
  });

  it('Should succeed manual query set creation with 200 status', () => {
    // Switch to manual input mode
    cy.contains('Switch to manually adding queries').click();
    cy.wait(2000); // Wait for UI to update after mode switch

    // Fill in the required fields
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .first()
      .focus()
      .type('Test Manual Query Set');
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .last()
      .focus()
      .type('Test Manual Query Set Description');

    // Create NDJSON content (one JSON object per line)
    const fileContent = [
      { queryText: 'test query 1', referenceAnswer: 'test answer 1' },
      { queryText: 'test query 2', referenceAnswer: 'test answer 2' },
    ]
      .map((obj) => JSON.stringify(obj))
      .join('\n');

    // Upload file with queries
    cy.get('[data-test-subj="manualQueriesFilePicker"]').attachFile({
      fileContent,
      fileName: 'queries.txt',
      mimeType: 'text/plain',
    });

    // Alternative approach if the above doesn't work
    cy.get('[data-test-subj="manualQueriesFilePicker"]').then(($input) => {
      // Create a blob with the file content
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const testFile = new File([blob], 'queries.txt', { type: 'text/plain' });
      const dataTransfer = new DataTransfer();

      dataTransfer.items.add(testFile);
      const myFileList = dataTransfer.files;

      // Manually set the files
      $input[0].files = myFileList;
      $input[0].dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Verify preview is shown
    cy.contains('Preview').should('be.visible');

    // Click create button
    cy.get('[data-test-subj="createQuerySetButton"]').click();

    // Expect success message
    cy.contains('Query set "Test Manual Query Set" created successfully', {
      timeout: 10000,
    });

    // Navigate to query set listing page
    cy.visit(`${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/querySet`);
    cy.wait(3000);

    // Find and click on the "Test Manual Query Set" link
    cy.contains('Test Manual Query Set').click();

    // Verify we're on the query set view page
    cy.url().should('include', '/querySet/view/');

    // Verify we're on the query set details page
    cy.contains('Query Set Details').should('be.visible');
    // PR #264 changed format from "queryText#referenceAnswer" to "queryText#{"referenceAnswer":"..."}"
    cy.contains('test query 1#{"referenceAnswer":"test answer 1"}').should('be.visible');
    cy.contains('test query 2#{"referenceAnswer":"test answer 2"}').should('be.visible');
  });

  it('Should show validation errors for empty required fields', () => {
    // Click create without filling required fields
    cy.get('[data-test-subj="createQuerySetButton"]').click();

    // Verify error messages
    cy.contains('Name is a required parameter');
    cy.contains('Description is a required parameter');
  });

  it('Should navigate back on cancel', () => {
    // Click cancel button
    cy.get('[data-test-subj="cancelQuerySetButton"]').click();

    // Verify navigation
    cy.url().should('include', '/querySet');
  });
});
