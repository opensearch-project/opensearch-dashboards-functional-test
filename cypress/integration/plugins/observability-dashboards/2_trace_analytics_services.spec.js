/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  delayTime,
  SERVICE_NAME,
  setTimeFilter,
} from '../../../utils/constants';

describe('Testing services table empty state', () => {
  beforeEach(() => {
    cy.visit('app/observability-traces#/services', {
      onBeforeLoad: (win) => {
        win.sessionStorage.clear();
      },
    });
    cy.wait(delayTime * 3);
  });

  it('Renders empty state', () => {
    cy.contains(' (0)').should('exist');
    cy.contains('No matches').should('exist');
  });
});

describe('Testing services table', () => {
  beforeEach(() => {
    cy.visit('app/observability-traces#/services', {
      onBeforeLoad: (win) => {
        win.sessionStorage.clear();
      },
    });
    setTimeFilter();
  });

  it('Renders the services table', () => {
    cy.contains(' (8)').should('exist');
    cy.contains('analytics-service, frontend-client, recommendation').should(
      'exist'
    );
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

  it('Renders service view empty state', () => {
    cy.contains('frontend-client').should('exist');
    cy.get('.euiText').contains('0').should('exist');
    cy.get('.euiText').contains('-').should('exist');
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
    setTimeFilter(false, false);
  });

  it('Renders service view', () => {
    cy.get('h2.euiTitle').contains(SERVICE_NAME).should('exist');
    cy.get('div.vis-network').should('exist');
  });
});
