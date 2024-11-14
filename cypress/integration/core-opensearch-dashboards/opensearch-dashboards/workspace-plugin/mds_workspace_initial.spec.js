/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { ADMIN_AUTH } from '../../../../utils/commands';
import workspaceTestUser from '../../../../fixtures/dashboard/opensearch_dashboards/workspace/workspaceTestUser.json';
import workspaceTestRole from '../../../../fixtures/dashboard/opensearch_dashboards/workspace/workspaceTestRole.json';
import workspaceTestRoleMapping from '../../../../fixtures/dashboard/opensearch_dashboards/workspace/workspaceTestRoleMapping.json';

const miscUtils = new MiscUtils(cy);
const workspaceName = 'test_workspace';
let workspaceId;
let workspaceFeatures = ['use-case-observability'];
const NONE_DASHBOARDS_ADMIN_USERNAME = 'workspace-test';
const WORKSPACE_TEST_ROLE_NAME = 'workspace-test-role';

if (Cypress.env('WORKSPACE_ENABLED')) {
  describe('Workspace initial', () => {
    describe('OSD admin user visits workspace initial page', () => {
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
        cy.contains(
          'Create a workspace or request a workspace owner to add you as a collaborator.'
        ).should('exist');

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

      it('should return user to homepage when clicking home icon and show correct recent access message', () => {
        cy.contains(workspaceName).click();
        cy.location('pathname', { timeout: 6000 }).should(
          'include',
          `/w/${workspaceId}/app/`
        );
        cy.get('button[aria-label="go-to-home"]').click();
        cy.location('pathname', { timeout: 6000 }).should(
          'include',
          `/app/home`
        );

        cy.contains('Viewed a few seconds ago');
      });

      it('should click create button and navigate to workspace create page', () => {
        // Click the create button at the upper right corner
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

        miscUtils.visitPage(`/app/home`);
        // Click the use case create icon button
        cy.getElementByTestId(
          'workspace-initial-useCaseCard-observability-button-createWorkspace'
        ).click();

        cy.location('pathname', { timeout: 6000 }).should(
          'include',
          `/app/workspace_create`
        );
        cy.location('hash').should('include', 'useCase=Observability');

        cy.getElementByTestId('workspaceUseCase-observability')
          .get(`input[type="radio"]`)
          .should('be.checked');

        miscUtils.visitPage(`/app/home`);
        // Click the create button in no workspace message
        cy.getElementByTestId(
          'workspace-initial-useCaseCard-search-button-createWorkspace'
        ).click();

        cy.location('pathname', { timeout: 6000 }).should(
          'include',
          `/app/workspace_create`
        );
        cy.location('hash').should('include', 'useCase=Search');

        cy.getElementByTestId('workspaceUseCase-search')
          .get(`input[type="radio"]`)
          .should('be.checked');
      });

      it('should navigate to workspace list page with use case filter', () => {
        // Click will all button in the use case card
        cy.getElementByTestId(
          'workspace-initial-useCaseCard-observability-button-view'
        ).click();
        cy.location('pathname', { timeout: 6000 }).should(
          'include',
          `/app/workspace_list`
        );
        cy.location('hash').should('include', 'useCase=Observability');
        cy.contains(workspaceName).should('exist');

        // Default filtering based on use cases
        cy.get('input[type="search"]').should(
          'have.value',
          'useCase:"Observability"'
        );

        miscUtils.visitPage(`/app/home`);
        // Click will all workspace button
        cy.contains('View all workspaces').click();
        cy.location('pathname', { timeout: 6000 }).should(
          'include',
          `/app/workspace_list`
        );

        cy.contains(workspaceName).should('exist');
        cy.get('input[type="search"]').should('have.value', '');
      });
    });

    if (Cypress.env('SECURITY_ENABLED')) {
      describe('Non OSD admin user visits workspace initial page', () => {
        const originalUser = ADMIN_AUTH.username;
        const originalPassword = ADMIN_AUTH.password;
        before(() => {
          ADMIN_AUTH.newUser = originalUser;
          ADMIN_AUTH.newPassword = originalPassword;
          cy.createInternalUser(
            NONE_DASHBOARDS_ADMIN_USERNAME,
            workspaceTestUser
          );
          cy.createRole(WORKSPACE_TEST_ROLE_NAME, workspaceTestRole);
          cy.createRoleMapping(
            WORKSPACE_TEST_ROLE_NAME,
            workspaceTestRoleMapping
          );
        });
        beforeEach(() => {
          // Login as non OSD admin user
          ADMIN_AUTH.newUser = NONE_DASHBOARDS_ADMIN_USERNAME;
          ADMIN_AUTH.newPassword = workspaceTestUser.password;
          // Visit workspace initial page
          miscUtils.visitPage(`/app/home`);
        });
        after(() => {
          ADMIN_AUTH.newUser = originalUser;
          ADMIN_AUTH.newPassword = originalPassword;
          cy.deleteRoleMapping(WORKSPACE_TEST_ROLE_NAME);
          cy.deleteInternalUser(NONE_DASHBOARDS_ADMIN_USERNAME);
          cy.deleteRole(WORKSPACE_TEST_ROLE_NAME);
        });

        it('should show correct no workspaces content', () => {
          cy.contains(
            'Request a workspace owner to add you as a collaborator.'
          ).should('exist');
        });

        it('should not show create workspace button', () => {
          cy.getElementByTestId(
            'workspace-initial-card-createWorkspace-button'
          ).should('not.exist');
          cy.getElementByTestId(
            'workspace-initial-useCaseCard-observability-button-createWorkspace'
          ).should('not.exist');
          cy.getElementByTestId(
            'workspace-initial-useCaseCard-search-button-createWorkspace'
          ).should('not.exist');
        });
      });
    }
  });
}
