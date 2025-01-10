/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { setTimeFilter, TRACE_ID } from '../../../utils/constants';

describe('Testing traces table', () => {
  beforeEach(() => {
    cy.visit('app/observability-traces#/traces', {
      onBeforeLoad: (win) => {
        win.sessionStorage.clear();
      },
    });
    setTimeFilter();
  });

  it('Sorts the traces table', () => {
    cy.get(
      '[data-test-subj="trace-groups-service-operation-accordian"]'
    ).click();

    cy.get('[data-test-subj="dashboard-table-trace-group-name-button"]').should(
      'be.visible'
    );

    cy.get('.euiTableRow')
      .first()
      .contains('client_create_order')
      .should('exist');
    cy.get('.euiTableCellContent').contains('Trace group').click();
    cy.get('.euiTableRow').first().contains('/**').should('exist');
  });

  it('Searches correctly', () => {
    cy.get('input[type="search"]').focus().type(`${TRACE_ID}{enter}`);
    cy.get('button[data-test-subj="superDatePickerApplyTimeButton"]').click();
    cy.contains(' (1)').should('exist');
    cy.contains('03/25/2021 10:21:22').should('exist');
  });
});

describe('Testing trace view', () => {
  beforeEach(() => {
    cy.visit(`app/observability-traces#/traces/${TRACE_ID}`, {
      onBeforeLoad: (win) => {
        win.sessionStorage.clear();
      },
    });
  });
});
