/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

describe('WLM Main Page', () => {
  beforeEach(() => {
    cy.visit('/app/workload-management#/workloadManagement');
    cy.get('.euiBasicTable .euiTableRow').should('have.length.greaterThan', 0);
  });

  it('should display the WLM page with the workload group table', () => {
    cy.contains('Workload groups').should('be.visible');
    cy.get('.euiBasicTable').should('exist');
    cy.get('.euiTableRow').should('have.length.greaterThan', 0);
  });

  it('should filter workload groups with the search bar', () => {
    cy.get('.euiFieldSearch').type('DEFAULT_QUERY_GROUP');
    cy.get('.euiTableRow').should('have.length.at.least', 1);
    cy.get('.euiFieldSearch').clear();
    cy.get('.euiTableRow').should('have.length.greaterThan', 0);
  });

  it('should refresh stats on clicking the refresh button', () => {
    return cy.get('.euiTableRow').then(() => {
      cy.get('button').contains('Refresh').click();

      cy.get('.euiTableRow', { timeout: 10000 }).should(($newRows) => {
        expect($newRows.length).to.be.greaterThan(0);
      });
    });
  });

  it('should display the WLM main page with workload group table and summary stats', () => {
    // Confirm table exists
    cy.get('.euiBasicTable').should('be.visible');
    cy.get('.euiTableRow').should('have.length.greaterThan', 0);

    // Confirm stat cards exist
    const titles = ['Total workload groups', 'Total groups exceeding limits'];

    titles.forEach((title) => {
      cy.contains(title).should('be.visible');
    });
  });

  it('should filter workload groups by name in search', () => {
    cy.get('.euiFieldSearch').type('DEFAULT_WORKLOAD_GROUP');
    cy.get('.euiTableRow').should('contain.text', 'DEFAULT_WORKLOAD_GROUP');

    cy.get('.euiFieldSearch').clear().type('nonexistent_group_12345');
    cy.get('.euiTableRow').should('contain.text', 'No items found');
  });

  it('should route to workload group detail page when clicking a group name', () => {
    cy.get('.euiTableRow')
      .first()
      .within(() => {
        cy.get('a').first().click({ force: true });
      });

    cy.contains('Workload group name', { timeout: 10000 }).should('exist');
  });

  it('should route to the Create Workload Group page when clicking the Create button', () => {
    // Click the "Create workload group" button
    cy.contains('Create workload group').click();

    // Confirm we are on the create page
    cy.url().should('include', '/wlm-create');

    // Validate that the form elements exist
    cy.contains('Resiliency mode').should('be.visible');
    cy.get('[data-testid="indexInput"]').should('exist');
    cy.get('button').contains('+ Add another rule').should('exist');
    cy.get('input[data-testid="cpu-threshold-input"]').should('exist');
    cy.get('input[data-testid="memory-threshold-input"]').should('exist');
  });
});