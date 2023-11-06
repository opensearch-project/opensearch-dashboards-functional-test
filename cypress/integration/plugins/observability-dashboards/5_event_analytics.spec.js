/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />
import {
  delayTime,
  landOnEventHome,
} from '../../../utils/constants';

describe('Click actions', () => {
  beforeEach(() => {
    landOnEventHome();
  });

  it('Actions - add sample data', () => {
    cy.get('[data-test-subj="eventHomeAction"]').click();
    cy.wait(delayTime);
    cy.get('[data-test-subj="eventHomeAction__addSamples"]').click();
    cy.get('[data-test-subj="confirmModalConfirmButton"]').click();
    cy.contains('Sample events added successfully.', { timeout: 10000 });
  });
});

describe('Delete saved objects', () => {
  it('Delete visualizations/queries from event analytics', () => {
    landOnEventHome();
    cy.get('[data-test-subj="tablePaginationPopoverButton"]').click();
    cy.get('.euiContextMenuItem__text').contains('50 rows').click();
    cy.get('.euiCheckbox__input[data-test-subj="checkboxSelectAll"]').click();
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Actions').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Delete').click();
    cy.wait(delayTime);
    cy.get('button.euiButton--danger').should('be.disabled');
    cy.get('input.euiFieldText[placeholder="delete"]').type('delete');
    cy.get('button.euiButton--danger').should('not.be.disabled');
    cy.get('.euiButton__text').contains('Delete').click();
    cy.wait(delayTime * 4);
    cy.get('.euiTextAlign')
      .contains('No Queries or Visualizations')
      .should('exist');
  });
});
