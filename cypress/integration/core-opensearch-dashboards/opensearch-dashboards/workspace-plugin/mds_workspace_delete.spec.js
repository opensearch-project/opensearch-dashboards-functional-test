/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
const miscUtils = new MiscUtils(cy);
const workspace1Name = 'test_workspace_320sdfouAz';
let workspace1Description = 'This is a workspace1 description.';
const workspace2Name = 'test_workspace_321sdfouAz';
let workspace2Description = 'This is a workspace2 description.';

let workspace1Id;
let workspace2Id;

if (Cypress.env('WORKSPACE_ENABLED')) {
  describe('Delete Workspace(s) in 2 ways in workspace list page', () => {
    before(() => {
      Cypress.config('defaultCommandTimeout', 60000);
      cy.deleteAllWorkspaces();
    });
    beforeEach(() => {
      // Visit workspace list page
      miscUtils.visitPage(`/app/workspace_list`);
      cy.createWorkspace({
        name: workspace1Name,
        description: workspace1Description,
        features: ['workspace_detail', 'use-case-observability'],
        settings: {
          permissions: {
            library_write: { users: ['%me%'] },
            write: { users: ['%me%'] },
          },
        },
      }).then((value) => {
        workspace1Id = value;
        cy.intercept('DELETE', `/api/workspaces/${workspace1Id}`).as(
          'deleteWorkspace1Request'
        );
      });

      cy.createWorkspace({
        name: workspace2Name,
        description: workspace2Description,
        features: ['workspace_detail', 'use-case-search'],
        settings: {
          permissions: {
            library_write: { users: ['%me%'] },
            write: { users: ['%me%'] },
          },
        },
      }).then((value) => {
        workspace2Id = value;
        cy.intercept('DELETE', `/api/workspaces/${workspace2Id}`).as(
          'deleteWorkspace2Request'
        );
      });
    });

    afterEach(() => {
      cy.deleteAllWorkspaces();
    });

    describe('delete a workspace successfully using action buttons', () => {
      it('should successfully load delete button and show delete modal when clicking action button', () => {
        cy.contains(workspace1Name).should('be.visible');
        cy.getElementByTestId('euiCollapsedItemActionsButton').first().click();
        cy.getElementByTestId('workspace-list-delete-icon').should(
          'be.visible'
        );
        cy.getElementByTestId('workspace-list-delete-icon').click();
        cy.contains('Delete workspace').should('be.visible');
        cy.contains(
          'The following workspace will be permanently deleted. This action cannot be undone'
        ).should('be.visible');
        cy.contains(workspace1Name).should('be.visible');
        cy.getElementByTestId('delete-workspace-modal-input').type('delete');
        cy.getElementByTestId('delete-workspace-modal-confirm').click();
        cy.wait('@deleteWorkspace1Request').then((interception) => {
          expect(interception.response.statusCode).to.equal(200);
        });
        cy.location('pathname').should('include', 'app/workspace_list');
        cy.contains('Delete workspace successfully').should('be.visible');
        cy.contains(workspace1Name).should('not.exist');
      });
    });

    describe('delete workspace(s) successfully using multi-deletion button', () => {
      it('should successfully show multi-deletion button and perform deletion when choosing one workspace', () => {
        cy.contains(workspace1Name).should('be.visible');
        cy.get('[data-test-subj^="checkboxSelectRow"]').first().click();
        cy.getElementByTestId('multi-deletion-button').should('be.visible');
        cy.getElementByTestId('multi-deletion-button').click();
        cy.contains('Delete workspace').should('be.visible');
        cy.contains(
          'The following workspace will be permanently deleted. This action cannot be undone'
        ).should('be.visible');
        cy.contains(workspace1Name).should('be.visible');
        cy.getElementByTestId('delete-workspace-modal-input').type('delete');
        cy.getElementByTestId('delete-workspace-modal-confirm').click();
        cy.wait('@deleteWorkspace1Request').then((interception) => {
          expect(interception.response.statusCode).to.equal(200);
        });
        cy.location('pathname').should('include', 'app/workspace_list');
        cy.contains('Delete workspace successfully').should('be.visible');
        cy.contains(workspace1Name).should('not.exist');
      });

      it('should successfully delete all', () => {
        cy.contains(workspace1Name).should('be.visible');
        cy.contains(workspace2Name).should('be.visible');
        cy.getElementByTestId('checkboxSelectAll').click();
        cy.getElementByTestId('multi-deletion-button').should('be.visible');
        cy.getElementByTestId('multi-deletion-button').click();
        cy.contains('Delete workspace').should('be.visible');
        cy.contains(
          'The following workspace will be permanently deleted. This action cannot be undone'
        ).should('be.visible');
        cy.contains(workspace1Name).should('be.visible');
        cy.contains(workspace2Name).should('be.visible');
        cy.getElementByTestId('delete-workspace-modal-input').type('delete');
        cy.getElementByTestId('delete-workspace-modal-confirm').click();
        cy.wait('@deleteWorkspace1Request').then((interception) => {
          expect(interception.response.statusCode).to.equal(200);
        });
        cy.location('pathname').should('include', 'app/workspace_list');
        cy.contains('Delete workspace successfully').should('be.visible');
        cy.contains(workspace1Name).should('not.exist');
        cy.contains(workspace2Name).should('not.exist');
      });
    });
  });

  describe('Workspace deletion in workspace detail page', () => {
    before(() => {
      cy.deleteWorkspaceByName(workspace1Name);
      cy.createWorkspace({
        name: workspace1Name,
        description: workspace1Description,
        features: ['workspace_detail', 'use-case-observability'],
        settings: {
          permissions: {
            library_write: { users: ['%me%'] },
            write: { users: ['%me%'] },
          },
        },
      }).then((value) => {
        workspace1Id = value;
      });
    });

    beforeEach(() => {
      cy.intercept(
        'DELETE',
        `/w/${workspace1Id}/api/workspaces/${workspace1Id}`
      ).as('deleteWorkspace1Request');
      miscUtils.visitPage(`w/${workspace1Id}/app/workspace_detail`);
    });

    it('should delete workspace in workspace detail page', () => {
      cy.getElementByTestId('workspace-detail-delete-button').click();
      cy.contains('Delete workspace').should('be.visible');
      cy.contains(workspace1Name).should('be.visible');
      cy.getElementByTestId('delete-workspace-modal-input').type(
        workspace1Name
      );
      cy.getElementByTestId('delete-workspace-modal-confirm').click();
      cy.wait('@deleteWorkspace1Request').then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
      });
      cy.contains('Delete workspace successfully').should('be.visible');
      cy.location('pathname').should('include', 'app/workspace_list');
      cy.contains(workspace1Name).should('not.exist');
    });
  });
}
