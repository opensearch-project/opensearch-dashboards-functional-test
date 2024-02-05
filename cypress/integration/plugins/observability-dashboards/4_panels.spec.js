/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  TEST_PANEL,
  TEST_PANEL_COPY,
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
    cy.get('.euiButton__text')
      .contains(/^Create$/)
      .trigger('mouseover')
      .click();
    cy.intercept('POST', '/api/saved_objects/*').as('createDashboard');
    cy.wait('@createDashboard');

    cy.contains(TEST_PANEL).should('exist');
  });

  it('Duplicates a panel', () => {
    cy.get('.euiCheckbox__input[title="Select this row"]', {
      timeout: PANELS_TIMEOUT,
    })
      .eq(0)
      .trigger('mouseover')
      .click();
    cy.get('.euiButton__text').contains('Actions').trigger('mouseover').click();
    cy.get('.euiContextMenuItem__text')
      .contains('Duplicate')
      .trigger('mouseover')
      .click();
    cy.get('.euiButton__text')
      .contains('Duplicate')
      .trigger('mouseover')
      .click();
    cy.intercept('POST', '/api/saved_objects/*').as('createDashboard');
    cy.wait('@createDashboard');

    cy.contains(TEST_PANEL_COPY);
  });
});
