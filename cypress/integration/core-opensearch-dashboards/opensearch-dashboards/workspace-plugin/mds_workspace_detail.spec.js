/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
const workspaceName = 'test_workspace_320sdfouAz';
let workspaceDescription = 'This is a workspace description.';
let workspaceId;
let workspaceFeatures = ['use-case-observability'];

if (Cypress.env('WORKSPACE_ENABLED')) {
  describe('Workspace detail', () => {
    before(() => {
      cy.deleteWorkspaceByName(workspaceName);
      cy.createWorkspace({
        name: workspaceName,
        description: workspaceDescription,
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
      // Visit workspace update page
      miscUtils.visitPage(`w/${workspaceId}/app/workspace_detail`);

      cy.intercept('PUT', `/w/${workspaceId}/api/workspaces/${workspaceId}`).as(
        'updateWorkspaceRequest'
      );
    });

    after(() => {
      cy.deleteWorkspaceById(workspaceId);
    });

    describe('workspace details', () => {
      beforeEach(() => {
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
  });
}
