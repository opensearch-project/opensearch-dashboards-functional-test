/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  PANEL_DELAY as delay,
  TEST_PANEL,
  BASE_PATH,
} from '../../../utils/constants';

const moveToPanelHome = () => {
  cy.visit(`${BASE_PATH}/app/observability-dashboards#`);
  cy.wait(delay * 3);
};

describe('Testing panels table', () => {
  beforeEach(() => {
    moveToPanelHome();
  });

  it('Creates a panel and redirects to the panel', () => {
    cy.get('.euiButton__text')
      .contains('Create Dashboard')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('input.euiFieldText').focus().type(TEST_PANEL, {
      delay: 50,
    });
    cy.get('.euiButton__text')
      .contains(/^Create$/)
      .trigger('mouseover')
      .click();
    cy.wait(delay);

    cy.contains(TEST_PANEL).should('exist');
  });

  it('Duplicates a panel', () => {
    cy.get('.euiCheckbox__input[title="Select this row"]')
      .eq(0)
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Actions').trigger('mouseover').click();
    cy.wait(delay);
    cy.get('.euiContextMenuItem__text')
      .contains('Duplicate')
      .trigger('mouseover')
      .click();
    cy.get('.euiButton__text')
      .contains('Duplicate')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
  });
});
