/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
const workspaceName = 'test_workspace_az3RBx6cE';
const MDSEnabled = Cypress.env('DATASOURCE_MANAGEMENT_ENABLED');

const inputWorkspaceName = (workspaceName) => {
  const nameInputTestId = 'workspaceForm-workspaceDetails-nameInputText';
  cy.getElementByTestId(nameInputTestId).clear();
  cy.getElementByTestId(nameInputTestId).type(workspaceName);
};

const inputDataSourceWhenMDSEnabled = (dataSourceTitle) => {
  if (!MDSEnabled) {
    return;
  }
  cy.getElementByTestId('workspace-creator-dataSources-assign-button').click();

  cy.get(`li[title="${dataSourceTitle}"]`).click();

  cy.getElementByTestId(
    'workspace-detail-dataSources-associateModal-save-button'
  ).click();
};

if (Cypress.env('WORKSPACE_ENABLED')) {
  describe('Create workspace', () => {
    let dataSourceTitle;
    before(() => {
      cy.deleteWorkspaceByName(workspaceName);
      if (MDSEnabled) {
        cy.deleteAllDataSources();
        cy.createDataSourceNoAuth().then((result) => {
          dataSourceTitle = result[1];
        });
      }
    });

    beforeEach(() => {
      // Visit workspace create page
      miscUtils.visitPage('app/workspace_create');

      cy.intercept('POST', '/api/workspaces').as('createWorkspaceRequest');
    });

    after(() => {
      cy.deleteWorkspaceByName(workspaceName);
      if (MDSEnabled) {
        cy.deleteAllDataSources();
      }
    });

    it('should successfully load the page', () => {
      cy.contains('Create a workspace', { timeout: 60000 });
    });

    describe('Create a workspace successfully', () => {
      it('should successfully create a workspace', () => {
        inputWorkspaceName(workspaceName);
        cy.getElementByTestId(
          'workspaceForm-workspaceDetails-descriptionInputText'
        ).type('test_workspace_description.+~!');
        cy.getElementByTestId('workspaceUseCase-observability').click({
          force: true,
        });
        inputDataSourceWhenMDSEnabled(dataSourceTitle);
        cy.getElementByTestId('workspaceForm-bottomBar-createButton').click({
          force: true,
        });

        let workspaceId;
        cy.wait('@createWorkspaceRequest').then((interception) => {
          expect(interception.response.statusCode).to.equal(200);
          workspaceId = interception.response.body.result.id;

          cy.location('pathname', { timeout: 6000 }).should(
            'include',
            `w/${workspaceId}/app`
          );

          const expectedWorkspace = {
            name: workspaceName,
            description: 'test_workspace_description.+~!',
            features: ['use-case-observability'],
          };
          cy.checkWorkspace(workspaceId, expectedWorkspace);
        });
      });
    });

    describe('Validate workspace name and description', () => {
      it('workspace name is required', () => {
        cy.getElementByTestId(
          'workspaceForm-workspaceDetails-nameInputText'
        ).clear();
        inputDataSourceWhenMDSEnabled(dataSourceTitle);
        cy.getElementByTestId('workspaceForm-bottomBar-createButton').click({
          force: true,
        });
        cy.contains('Enter a name.').should('exist');
      });

      it('workspace name is not valid', () => {
        inputWorkspaceName('./+');
        cy.getElementByTestId(
          'workspaceForm-workspaceDetails-descriptionInputText'
        ).type('test_workspace_description');
        inputDataSourceWhenMDSEnabled(dataSourceTitle);
        cy.getElementByTestId('workspaceForm-bottomBar-createButton').click({
          force: true,
        });
        cy.contains('Enter a valid name.').should('exist');
      });

      it('workspace name cannot use an existing name', () => {
        cy.deleteWorkspaceByName(workspaceName);
        cy.createWorkspace({
          name: workspaceName,
          features: ['use-case-observability'],
        });
        inputWorkspaceName(workspaceName);
        cy.getElementByTestId(
          'workspaceForm-workspaceDetails-descriptionInputText'
        ).type('test_workspace_description');
        cy.getElementByTestId('workspaceUseCase-observability').click({
          force: true,
        });
        inputDataSourceWhenMDSEnabled(dataSourceTitle);
        cy.getElementByTestId('workspaceForm-bottomBar-createButton').click({
          force: true,
        });
        cy.contains('workspace name has already been used').should('exist');
      });
    });

    if (
      Cypress.env('SAVED_OBJECTS_PERMISSION_ENABLED') &&
      Cypress.env('SECURITY_ENABLED')
    ) {
      describe('Create a workspace with permissions successfully', () => {
        before(() => {
          cy.deleteWorkspaceByName(workspaceName);
        });

        it('should successfully create a workspace with permissions', () => {
          inputWorkspaceName(workspaceName);
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-descriptionInputText'
          ).type('test_workspace_description');
          cy.getElementByTestId('workspaceUseCase-observability').click({
            force: true,
          });
          inputDataSourceWhenMDSEnabled(dataSourceTitle);
          cy.getElementByTestId('workspaceForm-bottomBar-createButton').click({
            force: true,
          });

          let workspaceId;
          cy.wait('@createWorkspaceRequest').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
            workspaceId = interception.response.body.result.id;
            cy.location('pathname', { timeout: 6000 }).should(
              'include',
              `w/${workspaceId}/app`
            );
            const expectedWorkspace = {
              name: workspaceName,
              description: 'test_workspace_description',
              features: ['use-case-observability'],
              permissions: {
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
      });
    }
  });
}
