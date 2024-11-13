/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { ADMIN_AUTH } from '../../../../utils/commands';
import workspaceTestUser from '../../../../fixtures/dashboard/opensearch_dashboards/workspace/workspaceTestUser.json';
import workspaceTestRole from '../../../../fixtures/dashboard/opensearch_dashboards/workspace/workspaceTestRole.json';
import workspaceTestRoleMapping from '../../../../fixtures/dashboard/opensearch_dashboards/workspace/workspaceTestRoleMapping.json';

const NONE_DASHBOARDS_ADMIN_USERNAME = 'workspace-test';
const WORKSPACE_TEST_ROLE_NAME = 'workspace-test-role';

const miscUtils = new MiscUtils(cy);
const workspaceName = 'test_workspace_320sdfouAz';
let workspaceDescription = 'This is a workspace description.';
let workspaceId;
let workspaceFeatures = ['use-case-observability'];

if (Cypress.env('WORKSPACE_ENABLED')) {
  describe('Workspace detail', () => {
    before(() => {
      if (Cypress.env('SECURITY_ENABLED')) {
        cy.createInternalUser(
          NONE_DASHBOARDS_ADMIN_USERNAME,
          workspaceTestUser
        );
        cy.createRole(WORKSPACE_TEST_ROLE_NAME, workspaceTestRole);
        cy.createRoleMapping(
          WORKSPACE_TEST_ROLE_NAME,
          workspaceTestRoleMapping
        );
      }
      cy.deleteWorkspaceByName(workspaceName);
      cy.createWorkspace({
        name: workspaceName,
        description: workspaceDescription,
        features: workspaceFeatures,
        settings: {
          permissions: {
            library_write: { users: ['%me%'] },
            write: { users: ['%me%'] },
            library_read: { users: [NONE_DASHBOARDS_ADMIN_USERNAME] },
            read: { users: [NONE_DASHBOARDS_ADMIN_USERNAME] },
          },
        },
      }).then((value) => (workspaceId = value));
    });

    after(() => {
      cy.deleteWorkspaceById(workspaceId);
      if (Cypress.env('SECURITY_ENABLED')) {
        cy.deleteInternalUser(NONE_DASHBOARDS_ADMIN_USERNAME);
      }
    });

    describe('workspace details', () => {
      beforeEach(() => {
        // Visit workspace update page
        miscUtils.visitPage(`w/${workspaceId}/app/workspace_detail`);

        cy.intercept(
          'PUT',
          `/w/${workspaceId}/api/workspaces/${workspaceId}`
        ).as('updateWorkspaceRequest');
        cy.getElementByTestId('workspaceForm-workspaceDetails-edit').click();
      });

      describe('Validate workspace name and description', () => {
        it('workspace name is required', () => {
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-nameInputText'
          ).clear({
            force: true,
          });
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-descriptionInputText'
          ).clear({
            force: true,
          });
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-descriptionInputText'
          ).type('test_workspace_description');
          cy.getElementByTestId('workspaceForm-bottomBar-updateButton').click({
            force: true,
          });
          cy.contains('Enter a name.').should('exist');
        });

        it('workspace name is not valid', () => {
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-nameInputText'
          ).clear({
            force: true,
          });
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-descriptionInputText'
          ).clear({
            force: true,
          });
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-nameInputText'
          ).type('./+');
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-descriptionInputText'
          ).type('test_workspace_description');
          cy.getElementByTestId('workspaceForm-bottomBar-updateButton').click({
            force: true,
          });
          cy.contains('Enter a valid name.').should('exist');
        });
      });

      describe('Update a workspace successfully', () => {
        it('should successfully update a workspace', () => {
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-nameInputText'
          ).clear({
            force: true,
          });
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-descriptionInputText'
          ).clear({
            force: true,
          });
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-nameInputText'
          ).type(workspaceName);
          workspaceDescription = 'test_workspace_description.+~!';
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-descriptionInputText'
          ).type(workspaceDescription);
          cy.getElementByTestId(
            'euiColorPickerAnchor workspaceForm-workspaceDetails-colorPicker'
          ).click();
          cy.get('button[aria-label="Select #6092C0 as the color"]').click();
          cy.get('button.euiSuperSelectControl')
            .contains('Observability')
            .click({
              force: true,
            });
          cy.get('button.euiSuperSelect__item').contains('Analytics').click({
            force: true,
          });
          cy.getElementByTestId('workspaceForm-bottomBar-updateButton').click({
            force: true,
          });
          cy.wait('@updateWorkspaceRequest').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
          });
          cy.location('pathname', { timeout: 6000 }).should(
            'include',
            'app/workspace_detail'
          );
          const expectedWorkspace = {
            name: workspaceName,
            description: 'test_workspace_description.+~!',
            color: '#6092C0',
            features: ['use-case-all'],
          };
          cy.checkWorkspace(workspaceId, expectedWorkspace);
          // Update features after updated
          workspaceFeatures = expectedWorkspace.features;
        });
      });
    });

    if (
      Cypress.env('SAVED_OBJECTS_PERMISSION_ENABLED') &&
      Cypress.env('SECURITY_ENABLED')
    ) {
      describe('update with different workspace access level', () => {
        const originalUser = ADMIN_AUTH.username;
        const originalPassword = ADMIN_AUTH.password;
        beforeEach(() => {
          ADMIN_AUTH.username = originalUser;
          ADMIN_AUTH.password = originalPassword;
        });
        after(() => {
          ADMIN_AUTH.newUser = originalUser;
          ADMIN_AUTH.newPassword = originalPassword;
        });
        it('should not able to update workspace meta for non workspace admin', () => {
          ADMIN_AUTH.newUser = NONE_DASHBOARDS_ADMIN_USERNAME;
          ADMIN_AUTH.newPassword = workspaceTestUser.password;

          // Visit workspace list page
          miscUtils.visitPage(`/app/workspace_list`);

          cy.getElementByTestId('headerApplicationTitle')
            .contains('Workspaces')
            .should('be.exist');

          cy.get('[role="main"]').contains(workspaceName).should('be.exist');

          cy.get(`#${workspaceId}-actions`).click();
          cy.getElementByTestId('workspace-list-edit-icon').click();

          cy.getElementByTestId('workspaceForm-workspaceDetails-edit').click();

          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-descriptionInputText'
          ).clear({
            force: true,
          });

          cy.getElementByTestId('workspaceForm-bottomBar-updateButton').click({
            force: true,
          });
          cy.getElementByTestId('globalToastList')
            .contains('Invalid workspace permission')
            .should('be.exist');
        });

        it('should able to update workspace meta for workspace admin', () => {
          const kibanaServerAdminWorkspace = {
            name: 'kibana-server-workspace-admin',
            features: ['use-case-all'],
            settings: {
              permissions: {
                library_write: { users: [NONE_DASHBOARDS_ADMIN_USERNAME] },
                write: { users: [NONE_DASHBOARDS_ADMIN_USERNAME] },
              },
            },
          };
          cy.deleteWorkspaceByName(kibanaServerAdminWorkspace.name);
          cy.createWorkspace(kibanaServerAdminWorkspace)
            .as('adminWorkspaceId')
            .then(() => {
              ADMIN_AUTH.newUser = NONE_DASHBOARDS_ADMIN_USERNAME;
              ADMIN_AUTH.newPassword = workspaceTestUser.password;
            });

          // Visit workspace list page
          miscUtils.visitPage(`/app/workspace_list`);

          cy.getElementByTestId('headerApplicationTitle')
            .contains('Workspaces')
            .should('be.exist');

          cy.get('[role="main"]')
            .contains(kibanaServerAdminWorkspace.name)
            .should('be.exist');

          cy.get('@adminWorkspaceId').then((adminWorkspaceId) => {
            cy.get(`#${adminWorkspaceId}-actions`).click();
          });
          cy.getElementByTestId('workspace-list-edit-icon').click();

          cy.getElementByTestId('workspaceForm-workspaceDetails-edit').click();

          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-descriptionInputText'
          ).clear({
            force: true,
          });

          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-descriptionInputText'
          ).type('This is a new workspace description.');

          cy.getElementByTestId('workspaceForm-bottomBar-updateButton').click({
            force: true,
          });
          cy.getElementByTestId('globalToastList')
            .contains('Update workspace successfully')
            .should('be.exist');

          cy.get('@adminWorkspaceId').then((adminWorkspaceId) => {
            const expectedWorkspace = {
              ...kibanaServerAdminWorkspace,
              description: 'This is a new workspace description.',
            };
            cy.checkWorkspace(adminWorkspaceId, expectedWorkspace);
            cy.deleteWorkspaceById(adminWorkspaceId);
          });
        });
      });
    }
  });
}
