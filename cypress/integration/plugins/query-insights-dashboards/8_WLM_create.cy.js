/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

describe('WLM Create Page', () => {
  beforeEach(() => {
    cy.visit('/app/workload-management#/wlm-create');
  });

  it('renders the full create form with required fields', () => {
    cy.contains('h1', 'Create workload group').should('exist');
    cy.contains('h2', 'Overview').should('exist');

    // Form labels and fields
    [
      'Name',
      'Description – Optional',
      'Resiliency mode',
      'Index wildcard',
      'Reject queries when CPU usage exceeds',
      'Reject queries when memory usage exceeds',
    ].forEach((label) => {
      cy.contains(label).should('exist');
    });

    cy.contains('Soft').should('exist');
    cy.contains('Enforced').should('exist');
    cy.contains('+ Add another rule').should('exist');
    cy.get('button').contains('Create workload group').should('exist');
  });

  it('shows validation errors for CPU and memory thresholds', () => {
    cy.get('[data-testid="cpu-threshold-input"]').clear().type('150');
    cy.contains('Value must be between 0 and 100').should('exist');

    cy.get('[data-testid="cpu-threshold-input"]').clear().type('0');
    cy.contains('Value must be between 0 and 100').should('exist');

    cy.get('[data-testid="memory-threshold-input"]').clear().type('101');
    cy.contains('Value must be between 0 and 100').should('exist');

    cy.get('[data-testid="memory-threshold-input"]').clear().type('0');
    cy.contains('Value must be between 0 and 100').should('exist');
  });

  it('creates a workload group successfully with valid inputs', () => {
    const groupName = `wlm_test_${Date.now()}`;

    cy.get('[data-testid="name-input"]').type(groupName);
    cy.contains('Soft').click();
    cy.get('[data-testid="indexInput"]').type('test-index');
    cy.get('[data-testid="cpu-threshold-input"]').type('10');
    cy.get('[data-testid="memory-threshold-input"]').type('20');

    cy.intercept('PUT', '/api/_wlm/workload_group').as('createRequest');
    cy.get('button').contains('Create workload group').click();

    cy.url().should('include', '/workloadManagement');
    cy.contains(groupName).should('exist');
  });

  it('adds and deletes a rule block', () => {
    cy.contains('+ Add another rule').click();
    cy.get('[data-testid="indexInput"]').should('have.length', 2);

    cy.get('[aria-label="Delete rule"]').first().click();
    cy.get('[data-testid="indexInput"]').should('have.length', 1);
  });

  it('navigates back to main page on Cancel', () => {
    cy.get('button').contains('Cancel').click();
    cy.url().should('include', '/workloadManagement');
  });
});
