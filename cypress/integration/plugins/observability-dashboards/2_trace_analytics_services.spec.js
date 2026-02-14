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

describe('Testing services table', () => {
  beforeEach(() => {
    cy.visit('app/observability-traces#/services', {
      onBeforeLoad: (win) => {
        win.sessionStorage.clear();
      },
    });
    setTimeFilter();
  });

  it('Searches correctly', () => {
    cy.get('input[type="search"]').first().focus();
    cy.get('input[type="search"]').first().type(`${SERVICE_NAME}{enter}`);
    cy.get('[data-test-subj="superDatePickerApplyTimeButton"]').click();
    cy.contains(' (1)').should('exist');
  });

  it('Opens service flyout', () => {
    cy.contains('6.42').should('exist');
    cy.get('button[data-test-subj^="service-flyout-action-btn"]')
      .first()
      .click();
    cy.wait(delayTime);
    cy.get('span').contains('Overview').should('exist');
  });
});
