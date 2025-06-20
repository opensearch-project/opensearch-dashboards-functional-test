/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { SEARCH_RELEVANCE_PLUGIN_NAME } from '../../../utils/plugins/search-relevance-dashboards/constants';
import { BASE_PATH } from '../../../utils/base_constants';

describe('Judgment Create', () => {
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

  beforeEach(() => {
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/judgment/create`
    );
    cy.wait(2000);
  });

  it('Should show empty state for LLM judgment when no configurations exist', () => {
    // Fill in name
    cy.get('input[name="name"]').type('Test Judgment');

    // Select LLM type
    cy.get('select').first().select('LLM_JUDGMENT');

    // Fill in model ID
    cy.get('input').eq(2).type('test-model-id');

    // Try to create
    cy.get('[data-test-subj="createJudgmentButton"]').click();

    // Should show error messages about missing query set and search configurations
    cy.contains('Please select a query set');
    cy.contains('Please select at least one search configuration');
  });

  it('Should show validation errors for empty required fields', () => {
    cy.get('[data-test-subj="createJudgmentButton"]').click();
    cy.contains('Name is a required parameter.');
  });

  it('Should navigate back on cancel', () => {
    cy.get('[data-test-subj="cancelJudgmentButton"]').click();
    cy.url().should('include', '/judgment');
  });

  it('Should allow UBI judgment creation without query sets or search configs', () => {
    // Fill in name
    cy.get('input[name="name"]').type('Test UBI Judgment');

    // Select UBI type
    cy.get('select').first().select('UBI_JUDGMENT');

    // Check UBI specific fields are visible and can be modified
    cy.contains('Click Model').should('be.visible');
    cy.get('select').eq(1).select('coec');

    cy.contains('Max Rank').should('be.visible');
    cy.get('input[type="number"]').clear().type('20');

    // Try to create (should still fail with Forbidden, but not due to missing configurations)
    cy.get('[data-test-subj="createJudgmentButton"]').click();

    cy.contains('Failed to create judgment');
    cy.contains('Forbidden');
  });
});
