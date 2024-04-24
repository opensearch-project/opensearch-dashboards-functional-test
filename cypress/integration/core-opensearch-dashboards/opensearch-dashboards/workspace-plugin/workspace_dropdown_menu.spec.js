/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../../utils/constants';

if (Cypress.env('WORKSPACE_ENABLED')) {
  describe('Workspace dropdown menu', () => {
    const workspaceNames = [
      'workspace_lkxk5',
      'workspace_Arlvr',
      'workspace_0jHlb',
    ];

    const workspaceNameIdMapping = {};

    before(() => {
      // cleanup existing workspaces
      cy.deleteAllWorkspaces();

      for (const workspaceName of workspaceNames) {
        cy.createWorkspace(workspaceName).then((workspaceId) => {
          workspaceNameIdMapping[workspaceName] = workspaceId;
        });
      }
    });

    after(() => {
      cy.deleteAllWorkspaces();
    });

    beforeEach(() => {
      localStorage.setItem('home:newThemeModal:show', false);
    });

    it('should display a list of workspace along with workspace quick actions', () => {
      cy.visit(BASE_PATH);
      cy.getElementByTestId('toggleNavButton').click();
      cy.get('#workspaceDropdownMenu').click();

      cy.get('.euiContextMenu').contains('Create workspace');
      cy.get('.euiContextMenu').contains('All workspaces');
      cy.get('.euiContextMenu').contains('workspace_lkxk5');
      cy.get('.euiContextMenu').contains('workspace_Arlvr');
      cy.get('.euiContextMenu').contains('workspace_0jHlb');
    });

    it('should navigate to workspace list page', () => {
      cy.visit(BASE_PATH);
      cy.getElementByTestId('toggleNavButton').click();
      cy.get('#workspaceDropdownMenu').click();

      cy.get('.euiContextMenu').contains('All workspaces').click();
      cy.url().should('include', '/app/workspace_list');
    });

    it('should navigate to workspace create page', () => {
      cy.visit(BASE_PATH);
      cy.getElementByTestId('toggleNavButton').click();
      cy.get('#workspaceDropdownMenu').click();

      cy.get('.euiContextMenu').contains('Create workspace').click();
      cy.url().should('include', '/app/workspace_create');
    });

    it('should display the current workspace on the top of the list', () => {
      const currentWorkspace = 'workspace_lkxk5';
      cy.visit(BASE_PATH);
      cy.getElementByTestId('toggleNavButton').click();
      cy.get('#workspaceDropdownMenu').click();

      cy.get('.euiContextMenu').contains(currentWorkspace).click();
      // navigate to the workspace overview page after clicking the workspace menu
      cy.url().should(
        'include',
        `/w/${workspaceNameIdMapping[currentWorkspace]}/app/workspace_overview`
      );

      cy.visit(
        `${BASE_PATH}/w/${workspaceNameIdMapping[currentWorkspace]}/app/workspace_update`
      );
      cy.getElementByTestId('toggleNavButton').click();
      cy.get('#workspaceDropdownMenu').click();

      // the current workspace displayed on the top of the list
      cy.get('.euiContextMenuItem').first().contains(currentWorkspace);
    });

    it('should display maximum 5 workspace in the list', () => {
      cy.visit(BASE_PATH);
      const newWorkspaceNames = [
        'workspace_mT4Ia',
        'workspace_asrqF',
        'workspace_KOi8S',
      ];

      // Create 3 more workspaces so that there are more than 5 workspaces in the system
      for (const workspaceName of newWorkspaceNames) {
        cy.createWorkspace(workspaceName);
      }

      cy.getElementByTestId('toggleNavButton').click();
      cy.get('#workspaceDropdownMenu').click();

      // Only 5 workspaces should be displayed in the dropdown menu
      cy.get('.euiContextMenuItem')
        .filter(':contains("workspace_")')
        .should('have.length', 5);
    });
  });
}
