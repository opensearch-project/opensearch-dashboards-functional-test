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

const PLUGIN_TIMEOUT = 30000;

describe('Judgment Create', () => {
  before(() => {
    cy.visit(Cypress.config().baseUrl, { timeout: 10000 });
    initializeUbiIndices();
    enableWorkbenchUI();
  });

  beforeEach(() => {
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/judgment/create`
    );
    cy.get('[data-test-subj="createJudgmentButton"]', {
      timeout: PLUGIN_TIMEOUT,
    }).should('exist');
  });

  it('Should show empty state for LLM judgment when no configurations exist', () => {
    cy.get('input[name="name"]').type('Test Judgment');
    cy.get('select').first().select('LLM_JUDGMENT');
    cy.get('input').eq(2).type('test-model-id');
    cy.get('[data-test-subj="createJudgmentButton"]').click();

    cy.get('body', { timeout: PLUGIN_TIMEOUT }).should(($body) => {
      const text = $body.text().toLowerCase();
      expect(
        text.includes('please select') && text.includes('query set'),
        'Should ask to select query set'
      ).to.be.true;
      expect(
        text.includes('please select') && text.includes('search configuration'),
        'Should ask to select search config'
      ).to.be.true;
    });
  });

  it('Should show validation errors for empty required fields', () => {
    cy.get('[data-test-subj="createJudgmentButton"]').click();
    // Validation may show as inline form errors, toasts, or callouts
    cy.get('body', { timeout: PLUGIN_TIMEOUT }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasValidationError =
        (text.includes('name') && text.includes('required')) ||
        text.includes('is required') ||
        text.includes('enter a name') ||
        text.includes('must provide') ||
        text.includes('cannot be empty') ||
        text.includes('invalid') ||
        text.includes('please select') ||
        text.includes('please enter') ||
        text.includes('please provide') ||
        text.includes('failed');
      expect(
        hasValidationError,
        'Body should contain a validation error message'
      ).to.be.true;
    });
  });

  it('Should navigate back on cancel', () => {
    cy.get('[data-test-subj="cancelJudgmentButton"]').click();
    cy.url().should('include', '/judgment');
  });

  it('Should succeed UBI judgment creation with 200 status', () => {
    cy.get('input[name="name"]').type('Test UBI Judgment');
    cy.get('select').first().select('UBI_JUDGMENT');

    cy.contains('Click Model').should('be.visible');
    cy.get('select').eq(1).select('coec');

    cy.contains('Max Rank').should('be.visible');
    cy.get('input[type="number"]').clear().type('20');

    cy.get('[data-test-subj="createJudgmentButton"]').click();

    cy.get('body', { timeout: PLUGIN_TIMEOUT }).should(($body) => {
      const text = $body.text().toLowerCase();
      expect(
        text.includes('judgment') && text.includes('created successfully'),
        'Success message should appear'
      ).to.be.true;
    });

    cy.visit(`${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/judgment`);
    cy.contains('Test UBI Judgment', { timeout: PLUGIN_TIMEOUT }).click();
    cy.url().should('include', '/judgment/view/');
    cy.contains('futon frames full size without mattress').should('be.visible');
  });
});
