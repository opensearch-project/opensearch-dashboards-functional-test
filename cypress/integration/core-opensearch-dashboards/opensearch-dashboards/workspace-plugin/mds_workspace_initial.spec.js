/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
const workspaceName = 'test_workspace';
let workspaceId;
let workspaceFeatures = ['use-case-observability'];

if (Cypress.env('WORKSPACE_ENABLED')) {
  describe('Workspace initial', () => {
    before(() => {
      cy.deleteWorkspaceByName(workspaceName);
      cy.createWorkspace({
        name: workspaceName,
        features: workspaceFeatures,
        settings: {
          permissions: {
            library_write: { users: ['%me%'] },
            write: { users: ['%me%'] },
          },
        },
      }).then((value) => (workspaceId = value));
    });

    beforeEach(() => {
      // Visit workspace initial page
      miscUtils.visitPage(`/app/home`);
    });

    after(() => {
      cy.deleteWorkspaceById(workspaceId);
    });

    it('should contain correct content', () => {
      // contains initial page title and description
      cy.contains('Welcome to OpenSearch').should('exist');
      cy.contains('My workspaces').should('exist');
      cy.contains(
        'Collaborate on use-case based projects with workspaces. Select a workspace to get started.'
      ).should('exist');

      // contains five use case title
      cy.contains('Observability').should('exist');
      cy.contains('Security Analytics').should('exist');
      cy.contains('Search').should('exist');
      cy.contains('Essentials').should('exist');
      cy.contains('Analytics').should('exist');

      // contains no workspace message
      cy.contains('No workspaces').should('exist');

      // contains created workspaces
      cy.contains(workspaceName).should('exist');

      // contains correct link
      cy.contains('a', 'Learn more from documentation').should('exist');
      cy.get(
        'a[href="https://opensearch.org/docs/latest/opensearch/index/"]'
      ).should('have.attr', 'target', '_blank');
      cy.contains(
        'a',
        'Explore live demo environment at playground.opensearch.org'
      ).should('exist');
      cy.get('a[href="https://playground.opensearch.org/"]').should(
        'have.attr',
        'target',
        '_blank'
      );

      // contain left bottom button
      cy.get('[id$="popoverForSettingsIcon"]').should('exist');
      cy.getElementByTestId('openDevToolsModal').should('exist');
      if (Cypress.env('SECURITY_ENABLED')) {
        cy.getElementByTestId('account-popover').should('exist');
      }
    });

    it('should show correct use case information', () => {
      cy.getElementByTestId(
        'workspace-initial-useCaseCard-observability-button-information'
      ).click();
      cy.contains('Use cases').should('exist');
      cy.contains(
        'Gain visibility into system health, performance, and reliability through monitoring of logs, metrics and traces.'
      ).should('exist');
    });

    it('should navigate to the workspace', () => {
      cy.contains(workspaceName).click();

      cy.location('pathname', { timeout: 6000 }).should(
        'include',
        `/w/${workspaceId}/app/`
      );
    });

    it('should navigate to workspace create page', () => {
      cy.getElementByTestId(
        'workspace-initial-card-createWorkspace-button'
      ).click();

      cy.getElementByTestId(
        'workspace-initial-button-create-essentials-workspace'
      ).click();
      cy.location('pathname', { timeout: 6000 }).should(
        'include',
        `/app/workspace_create`
      );
      cy.location('hash').should('include', 'useCase=Essentials');

      cy.getElementByTestId('workspaceUseCase-essentials')
        .get(`input[type="radio"]`)
        .should('be.checked');
    });

    it('should navigate to workspace list page with use case filter', () => {
      cy.getElementByTestId(
        'workspace-initial-useCaseCard-observability-button-view'
      ).click();

      cy.location('pathname', { timeout: 6000 }).should(
        'include',
        `/app/workspace_list`
      );
      cy.location('hash').should('include', 'useCase=Observability');

      cy.contains(workspaceName).should('exist');

      cy.get('input[type="search"]').should(
        'have.value',
        'useCase:"Observability"'
      );
    });

    it('should navigate to workspace list page', () => {
      cy.contains('View all workspaces').click();

      cy.location('pathname', { timeout: 6000 }).should(
        'include',
        `/app/workspace_list`
      );

      cy.contains(workspaceName).should('exist');
    });
  });
}
