/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
const miscUtils = new MiscUtils(cy);
const workspaceName = 'test_workspace_320sdfouAz';
let workspaceDescription = 'This is a workspace description.';
let workspaceId;

if (Cypress.env('WORKSPACE_ENABLED')) {
  describe('Workspace detail', () => {
    before(() => {
      cy.deleteWorkspaceByName(workspaceName);
      cy.createWorkspace({
        name: workspaceName,
        description: workspaceDescription,
        features: ['workspace_detail', 'use-case-observability'],
        settings: {
          permissions: {
            library_write: { users: ['%me%'] },
            write: { users: ['%me%'] },
          },
        },
      }).then((value) => (workspaceId = value));
    });

    beforeEach(() => {
      // Visit workspace update page
      miscUtils.visitPage(`w/${workspaceId}/app/workspace_detail`);

      cy.intercept('PUT', `/w/${workspaceId}/api/workspaces/${workspaceId}`).as(
        'updateWorkspaceRequest'
      );
    });

    after(() => {
      cy.deleteWorkspaceById(workspaceId);
    });

    it('should successfully load the page', () => {
      cy.contains(workspaceName, { timeout: 60000 }).should('be.visible');
      cy.contains('Overview', { timeout: 60000 }).should('be.visible');
      cy.contains('settings', { timeout: 60000 }).should('be.visible');

      if (Cypress.env('SAVED_OBJECTS_PERMISSION_ENABLED')) {
        cy.contains('Collaborators', { timeout: 60000 }).should('be.visible');
      }
    });

    describe('settings tab', () => {
      beforeEach(() => {
        cy.contains('settings').click();
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
          cy.getElementByTestId('workspaceForm-workspaceDetails-edit').click();
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-descriptionInputText'
          ).type('test_workspace_description');
          cy.getElementByTestId('workspaceForm-bottomBar-updateButton').click({
            force: true,
          });
          cy.contains('Name is required. Enter a name.').should('exist');
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
          cy.getElementByTestId('workspaceForm-workspaceDetails-edit').click();
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-nameInputText'
          ).type('./+');
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-descriptionInputText'
          ).type('test_workspace_description');
          cy.getElementByTestId('workspaceForm-bottomBar-updateButton').click({
            force: true,
          });
          cy.contains('Name is invalid. Enter a valid name.').should('exist');
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
          cy.getElementByTestId('workspaceForm-workspaceDetails-edit').click();
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-nameInputText'
          ).type(workspaceName);
          workspaceDescription = 'test_workspace_description.+~!';
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-descriptionInputText'
          ).type(workspaceDescription);
          cy.getElementByTestId(
            'euiColorPickerAnchor workspaceForm-workspaceDetails-colorPicker'
          ).type('#D36086');
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
            features: ['workspace_detail', 'use-case-observability'],
          };
          cy.checkWorkspace(workspaceId, expectedWorkspace);
        });
      });
    });

    if (
      Cypress.env('SAVED_OBJECTS_PERMISSION_ENABLED') &&
      Cypress.env('SECURITY_ENABLED')
    ) {
      describe('Update a workspace with permissions successfully', () => {
        beforeEach(() => {
          cy.contains('Collaborators').click();
        });
        it('should successfully update a workspace with permissions', () => {
          cy.getElementByTestId('workspaceForm-workspaceDetails-edit').click();
          cy.getElementByTestId(
            'workspaceForm-permissionSettingPanel-addNew'
          ).click();
          cy.get(
            'input[placeholder="Enter user name or uer ID"][value=""]'
          ).type('test_user_Fnxs972xC');
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
            description: workspaceDescription,
            features: ['workspace_detail', 'use-case-observability'],
            permissions: {
              read: {
                users: ['test_user_Fnxs972xC'],
              },
              library_read: {
                users: ['test_user_Fnxs972xC'],
              },
              write: {
                users: [`${Cypress.env('username')}`],
              },
              library_write: {
                users: [`${Cypress.env('username')}`],
              },
            },
          };
          cy.checkWorkspace(workspaceId, expectedWorkspace);
        });
      });
    }
  });
}
