/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
const miscUtils = new MiscUtils(cy);
const workspaceName = 'test_workspace_320sdfouAz';
const workspace = {
  name: workspaceName,
  id: null,
};
if (Cypress.env('WORKSPACE_ENABLED')) {
  describe('Update workspace', () => {
    before(() => {
      cy.deleteWorkspace(workspaceName);
      cy.createWorkspace(workspace);
    });

    beforeEach(() => {
      // Visit workspace update page
      miscUtils.visitPage(`w/${workspace.id}/app/workspace_update`);

      cy.intercept(
        'PUT',
        `/w/${workspace.id}/api/workspaces/${workspace.id}`
      ).as('updateWorkspaceRequest');
    });

    after(() => {
      cy.deleteWorkspace(workspaceName);
    });

    it('should successfully load the page', () => {
      cy.contains('Update Workspace', { timeout: 60000 });
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
        cy.getElementByTestId('workspaceForm-bottomBar-updateButton').click();
        cy.contains("Name can't be empty").should('exist');
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
        cy.getElementByTestId('workspaceForm-bottomBar-updateButton').click();
        cy.contains('Invalid workspace name').should('exist');
      });

      it('workspace description is not valid', () => {
        cy.getElementByTestId(
          'workspaceForm-workspaceDetails-descriptionInputText'
        ).clear({
          force: true,
        });
        cy.getElementByTestId(
          'workspaceForm-workspaceDetails-descriptionInputText'
        ).type('./+');
        cy.getElementByTestId('workspaceForm-bottomBar-updateButton').click();
        cy.contains('Invalid workspace description').should('exist');
      });
    });

    describe('Update a workspace successfully', () => {
      it('should successfully update a worksapce', () => {
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
        cy.getElementByTestId(
          'workspaceForm-workspaceDetails-descriptionInputText'
        ).type('test_workspace_description');
        cy.getElementByTestId(
          'euiColorPickerAnchor workspaceForm-workspaceDetails-colorPicker'
        ).type('#D36086');
        cy.getElementByTestId(
          'workspaceForm-workspaceFeatureVisibility-OpenSearch Dashboards'
        ).check({ force: true });
        cy.getElementByTestId('workspaceForm-bottomBar-updateButton').click();
        cy.wait('@updateWorkspaceRequest').then((interception) => {
          expect(interception.response.statusCode).to.equal(200);
        });
        cy.location('pathname', { timeout: 6000 }).should(
          'include',
          'app/workspace_overview'
        );
        const expectedWorkspace = {
          name: workspaceName,
          description: 'test_workspace_description',
          features: [
            'dashboards',
            'visualize',
            'discover',
            'opensearchDashboardsOverview',
            'workspace_update',
            'workspace_overview',
          ],
        };
        cy.checkWorkspace(workspaceName, expectedWorkspace);
      });
    });

    if (
      Cypress.env('SAVED_OBJECTS_PERMISSION_ENABLED') &&
      Cypress.env('SECURITY_ENABLED')
    ) {
      describe('Update a workspace with permissions successfully', () => {
        it('should successfully update a worksapce with permissions', () => {
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
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-descriptionInputText'
          ).type('test_workspace_description');
          cy.getElementByTestId(
            'euiColorPickerAnchor workspaceForm-workspaceDetails-colorPicker'
          ).type('#000000');
          cy.getElementByTestId(
            'workspaceForm-workspaceFeatureVisibility-OpenSearch Dashboards'
          ).check({ force: true });
          cy.get('[id$="discover"]').uncheck({ force: true });
          cy.get('button').contains('Users & Permissions').click();
          cy.getElementByTestId(
            'workspaceForm-permissionSettingPanel-user-addNew'
          ).click();
          cy.getElementByTestId('comboBoxSearchInput')
            .last()
            .type('test_user_Fnxs972xC');
          cy.getElementByTestId('workspaceForm-bottomBar-updateButton').click();
          cy.wait('@updateWorkspaceRequest').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
          });
          cy.location('pathname', { timeout: 6000 }).should(
            'include',
            'app/workspace_overview'
          );
          const expectedWorkspace = {
            name: workspaceName,
            description: 'test_workspace_description',
            features: [
              'dashboards',
              'visualize',
              'opensearchDashboardsOverview',
              'workspace_update',
              'workspace_overview',
            ],
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
          cy.checkWorkspace(workspaceName, expectedWorkspace);
        });
      });
    }
  });
}
