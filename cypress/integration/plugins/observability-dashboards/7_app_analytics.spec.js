/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  moveToCreatePage,
  expectMessageOnHover,
  baseQuery,
  nameOne,
  description,
  trace_one,
  trace_two,
  TYPING_DELAY,
  TIMEOUT_DELAY,
} from '../../../utils/constants';

describe('Creating application', () => {
  beforeEach(() => {
    moveToCreatePage();
  });

  it.skip('Creates an application and redirects to application', () => {
    expectMessageOnHover('createButton', 'Name is required.');
    cy.get('[data-test-subj="nameFormRow"]', { timeout: TIMEOUT_DELAY }).type(
      nameOne
    );
    expectMessageOnHover(
      'createButton',
      'Provide at least one log source, service, entity or trace group.'
    );
    cy.get('[data-test-subj="descriptionFormRow"]', {
      timeout: TIMEOUT_DELAY,
    }).type(description);
    cy.get('[data-test-subj="servicesEntitiesAccordion"]', {
      timeout: TIMEOUT_DELAY,
    })
      .trigger('mouseover')
      .click();
    cy.get('[data-test-subj="servicesEntitiesComboBox"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.focused().type('{downArrow}');
    cy.focused().type('{enter}');
    cy.get('[data-test-subj="servicesEntitiesCountBadge"]', {
      timeout: TIMEOUT_DELAY,
    }).should('contain', '1');
    cy.get('[data-test-subj="logSourceAccordion"]', { timeout: TIMEOUT_DELAY })
      .trigger('mouseover')
      .click();
    cy.get('[data-test-subj="createButton"]').should('not.be.disabled');
    cy.get('[data-test-subj="createAndSetButton"]').should('be.disabled');
    expectMessageOnHover(
      'createAndSetButton',
      'Log source is required to set availability.'
    );
    cy.get('[data-test-subj="searchAutocompleteTextArea"]', {
      timeout: TIMEOUT_DELAY,
    })
      .focus()
      .type(baseQuery, { delay: TYPING_DELAY });
    cy.get('[data-test-subj="traceGroupsAccordion"]', {
      timeout: TIMEOUT_DELAY,
    })
      .trigger('mouseover')
      .click();
    cy.get('[data-test-subj="traceGroupsComboBox"]', { timeout: TIMEOUT_DELAY })
      .scrollIntoView()
      .type('http');
    cy.get('.euiFilterSelectItem').contains(trace_one).trigger('click');
    cy.get('.euiFilterSelectItem').contains(trace_two).trigger('click');
    cy.get('[data-test-subj="traceGroupsCountBadge"]', {
      timeout: TIMEOUT_DELAY,
    }).should('contain', '2');
    cy.get('[data-test-subj="createButton"]', {
      timeout: TIMEOUT_DELAY,
    }).should('not.be.disabled');
    cy.intercept('POST', '/api/observability/application/').as(
      'addApplication'
    );
    cy.intercept('POST', 'panels').as('addPanels');
    cy.intercept('PUT', '/api/observability/application/').as('putApplication');
    cy.intercept('POST', 'query').as('postQuery');
    cy.get('[data-test-subj="createButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.wait('@addApplication');
    cy.wait('@addPanels');
    cy.wait('@putApplication');
    cy.wait('@postQuery');
    cy.get('[data-test-subj="applicationTitle"]', {
      timeout: TIMEOUT_DELAY,
    }).should('contain', nameOne);
    cy.get('[data-test-subj="app-analytics-panelTab"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="addFirstVisualizationText"]', {
      timeout: TIMEOUT_DELAY,
    }).should('exist');
  });
});