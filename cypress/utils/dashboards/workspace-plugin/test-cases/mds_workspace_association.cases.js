/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

export const WorkspaceAssociationTestCases = () => {
  const miscUtils = new MiscUtils(cy);
  const workspaceName = 'test_workspace_collaborators';
  let workspaceId;
  let dataSourceTitle1 = 'no_auth_data_source_title_1';
  let dataSourceTitle2 = 'no_auth_data_source_title_2';
  let dataSourceId1;
  let dataSourceId2;
  if (
    Cypress.env('WORKSPACE_ENABLED') &&
    Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')
  ) {
    describe('Workspace association data source', () => {
      before(() => {
        cy.createDataSourceNoAuth({ title: dataSourceTitle1 }).then(
          (result) => {
            dataSourceId1 = result[0];
          }
        );
        cy.createDataSourceNoAuth({ title: dataSourceTitle2 }).then(
          (result) => {
            dataSourceId2 = result[0];
          }
        );
      });
      beforeEach(() => {
        cy.deleteWorkspaceByName(workspaceName);
        //Create a workspace before each test
        cy.createWorkspace({
          name: workspaceName,
          features: ['use-case-observability'],
          settings: {
            permissions: {
              library_write: { users: ['%me%'] },
              write: { users: ['%me%'] },
            },
          },
        }).then((value) => {
          workspaceId = value;
        });
      });

      after(() => {
        cy.deleteDataSource(dataSourceId1);
        cy.deleteDataSource(dataSourceId2);
      });
      afterEach(() => {
        cy.deleteWorkspaceById(workspaceId);
      });

      it('should associate and dissociate data source successfully', () => {
        miscUtils.visitPage(`w/${workspaceId}/app/dataSources`);

        cy.getElementByTestId('workspaceAssociateDataSourceButton').click();
        cy.contains('OpenSearch data sources').click();
        cy.contains(dataSourceTitle1, {
          withinSubject: parent.document.body,
        }).click({ force: true });
        cy.contains(dataSourceTitle2, {
          withinSubject: parent.document.body,
        }).click({ force: true });
        cy.getElementByTestId(
          'workspace-detail-dataSources-associateModal-save-button'
        ).click();

        // The table is updated after successful association
        cy.contains('table', dataSourceTitle1);
        cy.contains('table', dataSourceTitle2);

        // The table is updated after successful dissociation
        cy.getElementByTestId('checkboxSelectAll').check();
        cy.getElementByTestId('dissociateSelectedDataSources').click();
        cy.getElementByTestId('confirmModalConfirmButton').click();
        cy.contains('table', dataSourceTitle1).should('not.exist');
        cy.contains('table', dataSourceTitle2).should('not.exist');
      });
    });
  }
};
