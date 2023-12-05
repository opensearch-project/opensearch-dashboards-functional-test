/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { SERVICE_NAME, setTimeFilter } from '../../../utils/constants';

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
    cy.get('.euiButton__text').contains('Refresh').click();
    cy.contains(' (1)').should('exist');
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
