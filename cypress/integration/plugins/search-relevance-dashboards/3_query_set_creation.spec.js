/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { SEARCH_RELEVANCE_PLUGIN_NAME } from '../../../utils/plugins/search-relevance-dashboards/constants';
import { BASE_PATH } from '../../../utils/base_constants';
import 'cypress-file-upload';

describe('Query Set Creation', () => {
  before(() => {
    cy.visit(Cypress.config().baseUrl, { timeout: 10000 });
    const miscUtils = new MiscUtils(cy);
    miscUtils.visitPage('app/management/opensearch-dashboards/settings');
    cy.waitForLoader();

    // Check current state of the toggle
    cy.get(
      'button[role="switch"][data-test-subj="advancedSetting-editField-search-relevance:experimental_workbench_ui_enabled"]',
      { timeout: 30000 }
    ).then(($button) => {
      const isEnabled = $button.attr('aria-checked') === 'true';

      // Only click if not already enabled
      if (!isEnabled) {
        cy.wrap($button).click({ force: true });
        cy.get('[data-test-subj="advancedSetting-saveButton"]').click({
          force: true,
        });
        cy.wait(10000);
      }
    });
  });

  it('Should fail UBI query set creation by default', () => {
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/querySet/create`
    );

    // Fill in the required fields
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .first()
      .type('Test Query Set Name');
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .last()
      .type('Test Query Set Description');

    // Select sampling method
    cy.get('[data-test-subj="querySetSamplingSelect"]').select('random');

    // Set query set size
    cy.get('[data-test-subj="querySetSizeInput"]').type('10');

    // Click create button
    cy.get('[data-test-subj="createQuerySetButton"]').click();

    // Expect Forbidden error message
    cy.contains('Failed to create query set', { timeout: 10000 });
    cy.contains('Forbidden');
  });

  it('Should fail manual query set creation with Forbidden error', () => {
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/querySet/create`
    );

    // Switch to manual input mode
    cy.contains('Switch to manually adding queries').click();

    // Fill in the required fields
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .first()
      .type('Manual Query Set');
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .last()
      .type('Manual Query Set Description');

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

    // Expect Forbidden error message
    cy.contains('Failed to create query set', { timeout: 10000 });
    cy.contains('Forbidden');
  });

  it('Should show validation errors for empty required fields', () => {
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/querySet/create`
    );

    // Click create without filling required fields
    cy.get('[data-test-subj="createQuerySetButton"]').click();

    // Verify error messages
    cy.contains('Name is a required parameter');
    cy.contains('Description is a required parameter');
  });

  it('Should navigate back on cancel', () => {
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/querySet/create`
    );

    // Click cancel button
    cy.get('[data-test-subj="cancelQuerySetButton"]').click();

    // Verify navigation
    cy.url().should('include', '/querySet');
  });
});
