/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
const miscUtils = new MiscUtils(cy);
const workspaceName = 'test_workspace_az3RBx6cE';

const inputWorkspaceName = (workspaceName) => {
  const nameInput = cy.getElementByTestId(
    'workspaceForm-workspaceDetails-nameInputText'
  );
  nameInput.clear();
  nameInput.type(workspaceName);
};

const inputWorkspaceColor = (color = '#000000') => {
  const colorPicker = cy.getElementByTestId(
    'euiColorPickerAnchor workspaceForm-workspaceDetails-colorPicker'
  );
  colorPicker.clear({ force: true });
  colorPicker.type(color);
};

if (Cypress.env('WORKSPACE_ENABLED')) {
  describe('Create workspace', () => {
    before(() => {
      cy.deleteWorkspaceByName(workspaceName);
    });

    beforeEach(() => {
      // Visit workspace create page
      miscUtils.visitPage('app/workspace_create');

      cy.intercept('POST', '/api/workspaces').as('createWorkspaceRequest');
    });

    after(() => {
      cy.deleteWorkspaceByName(workspaceName);
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
        inputWorkspaceColor();
        cy.getElementByTestId('workspaceUseCase-observability').click({
          force: true,
        });
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
        cy.getElementByTestId('workspaceForm-bottomBar-createButton').click({
          force: true,
        });
        cy.contains('Name is required. Enter a name.').should('exist');
      });

      it('workspace name is not valid', () => {
        inputWorkspaceName('./+');
        cy.getElementByTestId(
          'workspaceForm-workspaceDetails-descriptionInputText'
        ).type('test_workspace_description');
        cy.getElementByTestId('workspaceForm-bottomBar-createButton').click({
          force: true,
        });
        cy.contains('Name is invalid. Enter a valid name.').should('exist');
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
          inputWorkspaceColor();
          cy.getElementByTestId('workspaceUseCase-observability').click({
            force: true,
          });
          cy.getElementByTestId(
            'workspaceForm-permissionSettingPanel-addNew'
          ).click();
          cy.getElementByTestId('workspaceFormUserIdOrGroupInput')
            .last()
            .type('test_user_sfslja260');
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
            cy.checkWorkspace(workspaceId, expectedWorkspace);
          });
        });
      });
    }

    if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
      describe('Create a workspace with data sources successfully', () => {
        let dataSourceId;
        let dataSourceTitle;
        before(() => {
          cy.deleteWorkspaceByName(workspaceName);
          cy.createDataSourceNoAuth().then((result) => {
            dataSourceId = result[0];
            dataSourceTitle = result[1];
            return result;
          });
        });
        it('should successfully create a workspace with data sources', () => {
          inputWorkspaceName(workspaceName);
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-descriptionInputText'
          ).type('test_workspace_description');
          inputWorkspaceColor();
          cy.getElementByTestId('workspaceUseCase-observability').click({
            force: true,
          });
          cy.getElementByTestId(
            'workspace-creator-dataSources-assign-button'
          ).click();
          cy.contains('div', dataSourceTitle).click();
          cy.getElementByTestId(
            'workspace-detail-dataSources-associateModal-save-button'
          ).click();
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
            };
            cy.checkWorkspace(workspaceId, expectedWorkspace);
            cy.checkAssignedDatasource(dataSourceId, workspaceId);
            cy.deleteAllDataSources();
          });
        });
      });
    }
  });
}
