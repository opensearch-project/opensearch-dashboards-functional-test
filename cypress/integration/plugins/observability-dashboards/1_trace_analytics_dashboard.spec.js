/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { delayTime, setTimeFilter } from '../../../utils/constants';

describe('Testing dashboard table empty state', () => {
  beforeEach(() => {
    cy.visit('app/observability-traces#/', {
      onBeforeLoad: (win) => {
        win.sessionStorage.clear();
      },
    });
    cy.wait(delayTime * 3);
    cy.get(
      '[data-test-subj="trace-groups-service-operation-accordian"]'
    ).click();
  });
});

describe('Testing dashboard table', () => {
  beforeEach(() => {
    cy.visit('app/observability-traces#/', {
      onBeforeLoad: (win) => {
        win.sessionStorage.clear();
      },
    });
    setTimeFilter();
    cy.get(
      '[data-test-subj="trace-groups-service-operation-accordian"]'
    ).click();
  });

  it('Adds the percentile filters', () => {
    cy.contains(' >= 95 percentile').click({ force: true });
    cy.wait(delayTime);
    cy.contains(' >= 95 percentile').click({ force: true });
    cy.wait(delayTime);

    cy.contains('Latency percentile within trace group: >= 95th').should(
      'exist'
    );
    cy.contains(' (7)').should('exist');
    cy.contains('318.69').should('exist');

    cy.contains(' < 95 percentile').click({ force: true });
    cy.wait(delayTime);
    cy.contains(' < 95 percentile').click({ force: true });
    cy.wait(delayTime);

    cy.contains('Latency percentile within trace group: < 95th').should(
      'exist'
    );
    cy.contains(' (8)').should('exist');
    cy.contains('383.05').should('exist');
  });

  it('Opens latency trend popover', () => {
    setTimeFilter(true);
    cy.get('.euiButtonIcon[aria-label="Open popover"]').first().click();
    cy.get('text.ytitle[data-unformatted="Hourly latency (ms)"]').should(
      'exist'
    );
  });

  it('Redirects to traces table with filter', () => {
    cy.get('[data-test-subj="dashboard-table-traces-button"]')
      .contains('13')
      .click();
    cy.wait(delayTime);

    cy.contains(' (13)').should('exist');
    cy.contains('client_create_order').should('exist');

    cy.get('.euiSideNavItemButton__label').contains('Trace analytics').click();
    cy.wait(delayTime);

    cy.contains('client_create_order').should('exist');
  });
});

describe('Testing plots', () => {
  beforeEach(() => {
    cy.visit('app/observability-traces#/', {
      onBeforeLoad: (win) => {
        win.sessionStorage.clear();
      },
    });
    setTimeFilter();
    cy.get(
      '[data-test-subj="trace-groups-service-operation-accordian"]'
    ).click();
  });

  it('Renders plots', () => {
    cy.get('text.ytitle[data-unformatted="Error rate (%)"]').should('exist');
    cy.get('text.annotation-text[data-unformatted="Now: 14.81%"]').should(
      'exist'
    );
    cy.get('text.ytitle[data-unformatted="Throughput (n)"]').should('exist');
    cy.get('text.annotation-text[data-unformatted="Now: 108"]').should('exist');
  });
});
