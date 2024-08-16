/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  TEST_PANEL,
  BASE_PATH,
  PANELS_TIMEOUT,
} from '../../../utils/constants';

const moveToPanelHome = () => {
  cy.visit(`${BASE_PATH}/app/observability-dashboards#`);
};

describe('Testing panels table', () => {
  beforeEach(() => {
    moveToPanelHome();
  });

  it('Creates a panel and redirects to the panel', () => {
    // Extending timeout so page completely loads
    cy.get('.euiButton__text', { timeout: PANELS_TIMEOUT })
      .contains('Create Dashboard')
      .trigger('mouseover')
      .click();
    cy.location('href').should('include', 'create');
    cy.get('input.euiFieldText').focus().type(TEST_PANEL, {
      delay: 50,
    });
    cy.intercept('POST', `${BASE_PATH}/api/saved_objects/*`).as('createDashboard');
    cy.get('.euiButton__text')
      .contains(/^Create$/)
      .trigger('mouseover')
      .click();
    cy.wait('@createDashboard');

    cy.contains(TEST_PANEL).should('exist');
  });
});
