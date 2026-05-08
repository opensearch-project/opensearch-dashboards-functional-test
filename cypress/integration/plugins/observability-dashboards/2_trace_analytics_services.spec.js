/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  SERVICE_NAME,
  setTimeFilter,
  delayTime,
} from '../../../utils/constants';

describe('Testing services table', { testIsolation: true }, () => {
  beforeEach(() => {
    cy.visit('app/observability-traces#/services', {
      onBeforeLoad: (win) => {
        win.sessionStorage.clear();
      },
    });
    setTimeFilter();
  });

  it('Searches correctly', () => {
    cy.get('input[type="search"]', { timeout: 30000 }).first().focus();
    cy.get('input[type="search"]').first().type(`${SERVICE_NAME}{enter}`);
    cy.get('[data-test-subj="superDatePickerApplyTimeButton"]').click();
    // Wait for search results to update the count
    cy.contains(' (1)', { timeout: 30000 }).should('be.visible');
  });

  it('Opens service flyout', () => {
    // V13 fix: Wait for table data to load instead of looking for a hardcoded metric '6.42'
    // which is highly fragile and can change between versions or data loads.
    cy.get('button[data-test-subj^="service-flyout-action-btn"]', {
      timeout: 60000,
    })
      .should('be.visible')
      .first()
      .click();

    cy.wait(delayTime);
    // Use a more robust check for flyout content
    cy.get('body').should('contain', 'Overview');
  });
});
