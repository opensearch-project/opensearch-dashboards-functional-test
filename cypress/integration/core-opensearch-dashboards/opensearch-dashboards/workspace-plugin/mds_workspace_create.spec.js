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
        cy.getElementByTestId(
          'workspaceForm-workspaceDetails-nameInputText'
        ).type(workspaceName);
        cy.getElementByTestId(
          'workspaceForm-workspaceDetails-descriptionInputText'
        ).type('test_workspace_description.+~!');
        cy.getElementByTestId(
          'euiColorPickerAnchor workspaceForm-workspaceDetails-colorPicker'
        ).type('#000000');
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

    describe('Validate workspace name and description', () => {
      it('workspace name is required', () => {
        cy.getElementByTestId(
          'workspaceForm-workspaceDetails-descriptionInputText'
        ).type('test_workspace_description');
        cy.getElementByTestId('workspaceForm-bottomBar-createButton').click({
          force: true,
        });
        cy.contains('Name is required. Enter a name.').should('exist');
      });

      it('workspace name is not valid', () => {
        cy.getElementByTestId(
          'workspaceForm-workspaceDetails-nameInputText'
        ).type('./+');
        cy.getElementByTestId(
          'workspaceForm-workspaceDetails-descriptionInputText'
        ).type('test_workspace_description');
        cy.getElementByTestId('workspaceForm-bottomBar-createButton').click({
          force: true,
        });
        cy.contains('Name is invalid. Enter a valid name.').should('exist');
      });

      it('workspace name cannot use an existing name', () => {
        cy.getElementByTestId(
          'workspaceForm-workspaceDetails-nameInputText'
        ).type(workspaceName);
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

    it('workspace use case is required', () => {
      cy.getElementByTestId(
        'workspaceForm-workspaceDetails-nameInputText'
      ).type(workspaceName);
      cy.getElementByTestId('workspaceForm-bottomBar-createButton').click({
        force: true,
      });
      cy.contains('Use case is required. Select a use case.').should('exist');
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
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-nameInputText'
          ).type(workspaceName);
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-descriptionInputText'
          ).type('test_workspace_description');
          cy.getElementByTestId(
            'euiColorPickerAnchor workspaceForm-workspaceDetails-colorPicker'
          ).type('#000000');
          cy.getElementByTestId('workspaceUseCase-observability').click({
            force: true,
          });
          cy.getElementByTestId(
            'workspaceForm-permissionSettingPanel-user-addNew'
          ).click();
          cy.contains('.euiComboBoxPlaceholder', 'Select a user')
            .parent()
            .find('input')
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
              'app/workspace_detail'
            );
            const expectedWorkspace = {
              name: workspaceName,
              description: 'test_workspace_description',
              features: ['workspace_detail', 'use-case-observability'],
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
  });
}
