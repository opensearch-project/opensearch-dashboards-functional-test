/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  SERVICE_NAME,
  setTimeFilter,
  delayTime,
  TIMEOUT_DELAY,
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
    cy.get('input[type="search"]')
      .first()
      .focus()
      .type(`${SERVICE_NAME}{enter}`);
    cy.get('[data-test-subj="superDatePickerApplyTimeButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.contains(' (1)').should('exist');
  });

  it('Opens service flyout', () => {
    cy.get('button[data-test-subj^="service-flyout-action-btn"]')
      .first()
      .click();
    cy.wait(delayTime);
    cy.get('span').contains('Overview').should('exist');
  });
});

describe('Testing service view empty state', () => {
  beforeEach(() => {
    // exception is thrown on loading EuiDataGrid in cypress only, ignore for now
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('ResizeObserver loop')) return false;
    });
    cy.visit(`app/observability-traces#/services/${SERVICE_NAME}`, {
      onBeforeLoad: (win) => {
        win.sessionStorage.clear();
      },
    });
  });
});

describe('Testing service view', () => {
  beforeEach(() => {
    // exception is thrown on loading EuiDataGrid in cypress only, ignore for now
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('ResizeObserver loop')) return false;
    });
    cy.visit(`app/observability-traces#/services/${SERVICE_NAME}`, {
      onBeforeLoad: (win) => {
        win.sessionStorage.clear();
      },
    });
    setTimeFilter(undefined, false);
  });
});
