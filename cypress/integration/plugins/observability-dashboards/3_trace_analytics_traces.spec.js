/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { setTimeFilter, TRACE_ID } from '../../../utils/constants';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjs from 'dayjs';

dayjs.extend(customParseFormat);

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
    cy.get('[data-test-subj="trace-table-mode-selector"]').click();
    cy.get('.euiSelectableListItem__content').contains('Traces').click();
    cy.contains('Last updated').click();
    cy.contains('Sort A-Z').click();
    cy.get('[data-test-subj="globalLoadingIndicator"]').should('not.exist');
    cy.get('.euiDataGridRowCell').contains('/**').should('exist');
  });

  it('Searches correctly', () => {
    cy.get('input[type="search"]').first().focus();
    cy.get('input[type="search"]').first().type(`${TRACE_ID}{enter}`);
    cy.get('[data-test-subj="superDatePickerApplyTimeButton"]').click();
    cy.get('[data-test-subj="trace-table-mode-selector"]').click();
    cy.get('.euiSelectableListItem__content').contains('Traces').click();
    cy.contains(' (1)').should('exist');
    cy.contains('Mar 25, 2021 @ 10:21:22.896').should('exist');
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
