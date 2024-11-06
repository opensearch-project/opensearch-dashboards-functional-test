/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
const miscUtils = new MiscUtils(cy);
const workspaceName = 'test_workspace_az3RBx6cE';

const inputWorkspaceName = (workspaceName) => {
  const nameInputTestId = 'workspaceForm-workspaceDetails-nameInputText';
  cy.getElementByTestId(nameInputTestId).clear();
  cy.getElementByTestId(nameInputTestId).type(workspaceName);
};

const colors = [
  '#54B399',
  '#6092C0',
  '#D36086',
  '#9170B8',
  '#CA8EAE',
  '#D6BF57',
  '#B9A888',
  '#DA8B45',
  '#AA6556',
  '#E7664C',
];

const inputWorkspaceColor = (color = colors[2]) => {
  const colorPickerTestId = 'euiColorPickerAnchor';
  cy.getElementByTestId(colorPickerTestId).click({
    force: true,
  });
  cy.get(`button[aria-label="Select ${color} as the color"]`).click({
    force: true,
  });
};

if (
  Cypress.env('WORKSPACE_ENABLED') &&
  Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')
) {
  describe('Create workspace', () => {
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

    beforeEach(() => {
      // Visit workspace create page
      miscUtils.visitPage('app/workspace_create');

      cy.intercept('POST', '/api/workspaces').as('createWorkspaceRequest');
    });

    after(() => {
      cy.deleteWorkspaceByName(workspaceName);
      cy.deleteAllDataSources();
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
            description: 'test_workspace_description.+~!',
            features: ['use-case-observability'],
          };
          cy.checkWorkspace(workspaceId, expectedWorkspace);
          cy.checkAssignedDatasource(dataSourceId, workspaceId);
        });
      });
    });

    describe('Validate workspace name and description', () => {
      it('workspace name is required', () => {
        cy.getElementByTestId(
          'workspaceForm-workspaceDetails-nameInputText'
        ).clear();
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
        cy.contains('Name: Enter a name.').should('exist');
      });

      it('workspace name is not valid', () => {
        inputWorkspaceName('./+');
        cy.getElementByTestId(
          'workspaceForm-workspaceDetails-descriptionInputText'
        ).type('test_workspace_description');
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
        cy.contains('Name: Enter a valid name.').should('exist');
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
        cy.contains('workspace name has already been used').should('exist');
      });
    });
  });
}
