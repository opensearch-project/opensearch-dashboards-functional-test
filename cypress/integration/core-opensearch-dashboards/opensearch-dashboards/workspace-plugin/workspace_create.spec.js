/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
const miscUtils = new MiscUtils(cy);
const workspaceName = 'test_workspace_az3RBx6cE';
if (Cypress.env('WORKSPACE_ENABLED')) {
  describe('Create workspace', () => {
    before(() => {
      cy.deleteWorkspace(workspaceName);
    });

    beforeEach(() => {
      // Visit workspace create page
      miscUtils.visitPage('app/workspace_create');

      cy.intercept('POST', '/api/workspaces').as('createWorkspaceRequest');
    });

    after(() => {
      cy.deleteWorkspace(workspaceName);
    });

    it('should successfully load the page', () => {
      cy.contains('Create Workspace', { timeout: 60000 });
    });

    describe('Create a workspace successfully', () => {
      it('should successfully create a worksapce', () => {
        cy.getElementByTestId('workspaceForm-workspaceDetails-nameInputText').type(workspaceName);
        cy.getElementByTestId('workspaceForm-workspaceDetails-descriptionInputText').type(
          'test_workspace_description'
        );
        cy.getElementByTestId(
          'euiColorPickerAnchor workspaceForm-workspaceDetails-colorPicker'
        ).type('#000000');
        cy.getElementByTestId(
          'workspaceForm-workspaceFeatureVisibility-OpenSearch Dashboards'
        ).check({ force: true });
        cy.get('[id$="discover"]').uncheck({ force: true });
        cy.getElementByTestId('workspaceForm-bottomBar-createButton').click();
        cy.wait('@createWorkspaceRequest').then((interception) => {
          expect(interception.response.statusCode).to.equal(200);
        });
        cy.location('pathname', { timeout: 6000 }).should('include', 'app/workspace_overview');
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
        };
        cy.checkWorkspace(workspaceName, expectedWorkspace);
      });
    });

    describe('Validate workspace name and description', () => {
      it('workspace name is required', () => {
        cy.getElementByTestId('workspaceForm-workspaceDetails-descriptionInputText').type(
          'test_workspace_description'
        );
        cy.getElementByTestId('workspaceForm-bottomBar-createButton').click();
        cy.contains("Name can't be empty").should('exist');
      });

      it('workspace name is not valid', () => {
        cy.getElementByTestId('workspaceForm-workspaceDetails-nameInputText').type('./+');
        cy.getElementByTestId('workspaceForm-workspaceDetails-descriptionInputText').type(
          'test_workspace_description'
        );
        cy.getElementByTestId('workspaceForm-bottomBar-createButton').click();
        cy.contains('Invalid workspace name').should('exist');
      });

      it('workspace name cannot use an existing name', () => {
        cy.getElementByTestId('workspaceForm-workspaceDetails-nameInputText').type(workspaceName);
        cy.getElementByTestId('workspaceForm-workspaceDetails-descriptionInputText').type(
          'test_workspace_description'
        );
        cy.getElementByTestId('workspaceForm-bottomBar-createButton').click();
        cy.contains('workspace name has already been used').should('exist');
      });

      it('workspace description is not valid', () => {
        cy.getElementByTestId('workspaceForm-workspaceDetails-nameInputText').type(workspaceName);
        cy.getElementByTestId('workspaceForm-workspaceDetails-descriptionInputText').type('./+');
        cy.getElementByTestId('workspaceForm-bottomBar-createButton').click();
        cy.contains('Invalid workspace description').should('exist');
      });
    });

    if (Cypress.env('SAVED_OBJECTS_PERMISSION_ENABLED') && Cypress.env('SECURITY_ENABLED')) {
      describe('Create a workspace with permissions successfully', () => {
        it('should successfully create a worksapce with permissions', () => {
          cy.getElementByTestId('workspaceForm-workspaceDetails-nameInputText').type(workspaceName);
          cy.getElementByTestId('workspaceForm-workspaceDetails-descriptionInputText').type(
            'test_workspace_description'
          );
          cy.getElementByTestId(
            'euiColorPickerAnchor workspaceForm-workspaceDetails-colorPicker'
          ).type('#000000');
          cy.getElementByTestId(
            'workspaceForm-workspaceFeatureVisibility-OpenSearch Dashboards'
          ).check({ force: true });
          cy.get('[id$="discover"]').uncheck({ force: true });
          cy.get('button').contains('Users & Permissions').click();
          cy.getElementByTestId('workspaceForm-permissionSettingPanel-user-addNew').click();
          cy.getElementByTestId('comboBoxSearchInput').last().type('test_user_sfslja260');
          cy.getElementByTestId('workspaceForm-bottomBar-createButton').click();
          cy.wait('@createWorkspaceRequest').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
          });
          cy.location('pathname', { timeout: 6000 }).should('include', 'app/workspace_overview');
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
                users: ['test_user_sfslja260'],
              },
              library_read: {
                users: ['test_user_sfslja260'],
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
